import { scopeAllows, type ApiScope } from "../access";
import {
  ApiError,
  type ApiErrorCode,
  type OperationName,
  type Input,
  type Output,
  type RentalApi,
} from "./contracts";
import { assertApiOutput } from "./response-validation";

/** Relative, same-origin endpoints; no user-supplied URL or bearer-token storage. */
export const apiRoutes: Partial<
  Record<OperationName, { method: "GET" | "POST" | "PATCH"; path: string }>
> = {
  "reviews.create": { method: "POST", path: "/me/reviews" },
  "catalog.list": { method: "GET", path: "/products" },
  "catalog.get": { method: "GET", path: "/products/detail" },
  "session.get": { method: "GET", path: "/session" },
  "session.logout": { method: "POST", path: "/session/logout" },
  "profile.update": { method: "PATCH", path: "/me/profile" },
  "availability.calendar": { method: "GET", path: "/availability/calendar" },
  "availability.quote": { method: "POST", path: "/availability/quotes" },
  "orders.create": { method: "POST", path: "/me/orders" },
  "orders.list": { method: "GET", path: "/me/orders" },
  "orders.get": { method: "GET", path: "/me/orders/detail" },
  "admin.products.list": { method: "GET", path: "/admin/products" },
  "admin.products.save": { method: "POST", path: "/admin/products/save" },
  "admin.availability.list": { method: "GET", path: "/admin/availability" },
  "admin.availability.stock": {
    method: "GET",
    path: "/admin/availability/stock",
  },
  "admin.availability.save": {
    method: "POST",
    path: "/admin/availability/save",
  },
  "admin.availability.remove": {
    method: "POST",
    path: "/admin/availability/remove",
  },
  "admin.customers.list": { method: "GET", path: "/admin/customers" },
  "admin.reviews.list": { method: "GET", path: "/admin/reviews" },
  "admin.reviews.moderate": { method: "POST", path: "/admin/reviews/moderate" },
  "admin.staff.list": { method: "GET", path: "/admin/staff" },
  "admin.staff.update": { method: "PATCH", path: "/admin/staff" },
  "admin.orders.list": { method: "GET", path: "/admin/orders" },
  "admin.orders.transition": {
    method: "POST",
    path: "/admin/orders/transitions",
  },
};
const errorCodes: ApiErrorCode[] = [
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "UNAVAILABLE",
  "QUOTE_EXPIRED",
  "POLICY_REQUIRED",
  "NETWORK",
  "TIMEOUT",
  "ABORTED",
  "INVALID_RESPONSE",
];
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createHttpApi(config: {
  scope?: ApiScope;
  basePath?: string;
  fetcher?: typeof fetch;
  getCsrfToken: () => string | null;
  timeoutMs?: number;
}): RentalApi {
  const base = config.basePath ?? "/api/v1";
  if (!/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(base))
    throw new Error("API base must be a same-origin path.");
  const fetcher = config.fetcher ?? fetch;
  return {
    async call<K extends OperationName>(
      operation: K,
      input: Input<K>,
      options?: { signal?: AbortSignal },
    ): Promise<Output<K>> {
      if (config.scope && !scopeAllows(config.scope, operation))
        throw new ApiError(
          "FORBIDDEN",
          "This operation belongs to a different workspace.",
        );
      const route = apiRoutes[operation];
      if (!route)
        throw new ApiError("NOT_FOUND", "This operation is not available.");
      const headers: Record<string, string> = { Accept: "application/json" };
      let path = `${base}${config.scope === "admin" && operation.startsWith("session.") ? "/admin" : ""}${route.path}`;
      let body: string | undefined;
      if (route.method === "GET") {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(input ?? {})) {
          if (value !== undefined && value !== "")
            params.set(key, String(value));
        }
        if (params.size) path += `?${params}`;
      } else {
        headers["Content-Type"] = "application/json";
        // Public quotes do not mutate account data. Every other write needs CSRF.
        if (operation !== "availability.quote") {
          const token = config.getCsrfToken();
          if (!token)
            throw new ApiError(
              "UNAUTHENTICATED",
              "Please sign in again. Your draft is still here.",
            );
          headers["X-CSRF-Token"] = token;
        }
        const payload: Record<string, unknown> = { ...(input ?? {}) };
        if (
          "idempotencyKey" in payload &&
          typeof payload.idempotencyKey === "string"
        ) {
          headers["Idempotency-Key"] = payload.idempotencyKey;
          delete payload.idempotencyKey;
        }
        body = JSON.stringify(payload);
      }
      const timeout = AbortSignal.timeout(config.timeoutMs ?? 12000);
      const signal = options?.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout;
      try {
        const response = await fetcher(path, {
          method: route.method,
          headers,
          body,
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          signal,
        });
        if (
          response.status === 204 &&
          (operation === "session.logout" ||
            operation === "admin.availability.remove")
        )
          return undefined as Output<K>;
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const error =
            isRecord(payload) && isRecord(payload.error) ? payload.error : {};
          const fallback: ApiErrorCode =
            response.status === 401
              ? "UNAUTHENTICATED"
              : response.status === 403
                ? "FORBIDDEN"
                : response.status === 409
                  ? "CONFLICT"
                  : "INVALID_RESPONSE";
          const code =
            errorCodes.find((value) => value === error.code) ?? fallback;
          const fields: Record<string, string> = {};
          if (isRecord(error.fields))
            for (const [key, value] of Object.entries(error.fields))
              if (typeof value === "string") fields[key] = value;
          throw new ApiError(
            code,
            typeof error.message === "string"
              ? error.message
              : "The request could not be completed.",
            fields,
            response.status,
          );
        }
        if (!isRecord(payload) || !("data" in payload))
          throw new ApiError(
            "INVALID_RESPONSE",
            "The service returned an invalid response.",
          );
        assertApiOutput(operation, payload.data);
        return payload.data as Output<K>;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (options?.signal?.aborted)
          throw new ApiError("ABORTED", "Request cancelled.");
        if (timeout.aborted)
          throw new ApiError(
            "TIMEOUT",
            "The request timed out. You can retry safely.",
          );
        throw new ApiError(
          "NETWORK",
          "Unable to reach the service. Check your connection and retry.",
        );
      }
    },
  };
}
