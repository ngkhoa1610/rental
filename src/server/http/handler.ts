import "server-only";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { ApiError, type OperationName } from "@/lib/api/contracts";
import { apiRoutes } from "@/lib/api/http";
import { createServiceApi } from "@/server/rental/service";
import { parseInput } from "@/server/rental/input";
import { getDatabase } from "@/server/db/client";
import {
  sessionContext,
  verifyOrigin,
  verifyCsrf,
  rateLimit,
  readJson,
  tokenCookie,
} from "./security";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export function errorResponse(error: unknown): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (["P2002", "P2025", "P2034"].includes(error.code))
      error = new ApiError(
        "CONFLICT",
        "This record changed. Refresh it before trying again.",
        {},
        409,
      );
  }
  if (!(error instanceof ApiError))
    return Response.json(
      {
        error: {
          code: "UNAVAILABLE",
          message: "The service is temporarily unavailable. Please retry.",
        },
      },
      { status: 503, headers },
    );
  const status =
    error.status ||
    (
      {
        VALIDATION: 400,
        UNAUTHENTICATED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNAVAILABLE: 409,
        QUOTE_EXPIRED: 409,
        POLICY_REQUIRED: 503,
      } as Record<string, number>
    )[error.code] ||
    500;
  return Response.json(
    {
      error: { code: error.code, message: error.message, fields: error.fields },
    },
    {
      status,
      headers: {
        ...headers,
        ...(status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}
/** Injection is for in-process integration tests; no public test-login/bypass route exists. */
export async function handleRentalRequest(
  request: Request,
  path: string[],
  database?: PrismaClient,
): Promise<Response> {
  try {
    const relative = "/" + path.join("/");
    const scope =
      relative.startsWith("/admin/") || relative === "/admin"
        ? "admin"
        : "customer";
    const entries = (
      Object.entries(apiRoutes) as [
        OperationName,
        (typeof apiRoutes)[OperationName] | undefined,
      ][]
    )
      .filter(
        ([op, route]) =>
          route !== undefined &&
          relative ===
            (scope === "admin" && op.startsWith("session.") ? "/admin" : "") +
              route.path,
      )
      .map(([operation, route]) => [operation, route!] as const);
    if (!entries.length)
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Endpoint not found." } },
        { status: 404, headers },
      );
    const found = entries.find(([, r]) => r.method === request.method);
    if (!found)
      return Response.json(
        { error: { code: "VALIDATION", message: "Method not allowed." } },
        {
          status: 405,
          headers: {
            ...headers,
            Allow: entries.map(([, r]) => r.method).join(", "),
          },
        },
      );
    if (!database && !process.env.DATABASE_URL)
      throw new ApiError(
        "POLICY_REQUIRED",
        "The database is not configured.",
        {},
        503,
      );
    const db = database ?? getDatabase();
    const [operation] = found;
    const context = await sessionContext(db, request, scope);
    if (request.method !== "GET") {
      verifyOrigin(request);
      if (operation !== "availability.quote") verifyCsrf(request, context);
    }
    await rateLimit(db, request, context, operation);
    let input: unknown;
    if (request.method === "GET") {
      const search = new URL(request.url).searchParams;
      if ([...search.keys()].some((k) => search.getAll(k).length !== 1))
        throw new ApiError(
          "VALIDATION",
          "Duplicate query parameters are not allowed.",
        );
      input = Object.fromEntries(search);
    } else {
      input = await readJson(request);
      const key = request.headers.get("Idempotency-Key");
      if (
        key &&
        typeof input === "object" &&
        input !== null &&
        !Array.isArray(input)
      )
        input = { ...input, idempotencyKey: key };
    }
    const validated = parseInput(operation, input);
    const data = await createServiceApi(db, context).call(operation, validated);
    if (operation === "session.logout")
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          "Set-Cookie": `${tokenCookie(scope)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
        },
      });
    if (data === undefined) return new Response(null, { status: 204, headers });
    return Response.json({ data }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
