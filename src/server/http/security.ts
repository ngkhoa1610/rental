import "server-only";
import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api/contracts";
import type { ApiScope } from "@/lib/access";
import { authBoundary, principalFromUser } from "@/server/auth/policy";
import type { ServiceContext } from "@/server/rental/services";
export function serverOrigin(): string {
  const value = process.env.APP_ORIGIN;
  if (!value)
    throw new ApiError(
      "POLICY_REQUIRED",
      "The service origin is not configured.",
      {},
      503,
    );
  const url = new URL(value);
  if (url.origin !== value || !["http:", "https:"].includes(url.protocol))
    throw new ApiError(
      "POLICY_REQUIRED",
      "The service origin is not configured.",
      {},
      503,
    );
  return url.origin;
}
export function verifyOrigin(request: Request) {
  if (
    request.headers.get("origin") !== serverOrigin() ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ApiError(
      "FORBIDDEN",
      "This request origin is not allowed.",
      {},
      403,
    );
}
export function tokenCookie(scope: ApiScope) {
  return authBoundary(scope, process.env.NODE_ENV === "production").cookies
    .sessionToken.name;
}
export async function sessionContext(
  db: PrismaClient,
  request: Request,
  scope: ApiScope,
): Promise<ServiceContext> {
  const cookies = request.headers.get("cookie") ?? "";
  if (cookies.length > 8192)
    throw new ApiError("VALIDATION", "Cookie header is too large.", {}, 400);
  const raw = cookies
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(tokenCookie(scope) + "="))
    ?.slice(tokenCookie(scope).length + 1);
  let token = "";
  try {
    token = raw ? decodeURIComponent(raw) : "";
  } catch {
    throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
  }
  const now = new Date();
  const session = token
    ? await db.session.findFirst({
        where: { sessionToken: token, scope, expires: { gt: now } },
        include: { user: { include: { staff: true } } },
      })
    : null;
  const principal = principalFromUser(session?.user ?? null, scope);
  const secret = process.env.AUTH_SECRET;
  if (principal && !secret)
    throw new ApiError(
      "POLICY_REQUIRED",
      "Authentication is not configured.",
      {},
      503,
    );
  const csrfToken =
    principal && secret
      ? createHmac("sha256", secret)
          .update(`rental-api:${scope}:${session?.id}:${token}`)
          .digest("hex")
      : undefined;
  return {
    principal,
    scope,
    now,
    requestId: crypto.randomUUID(),
    sessionId: principal ? session?.id : undefined,
    csrfToken,
    signal: request.signal,
  };
}
export function verifyCsrf(request: Request, context: ServiceContext) {
  const supplied = request.headers.get("x-csrf-token") ?? "";
  const expected = context.csrfToken ?? "";
  if (!context.principal)
    throw new ApiError(
      "UNAUTHENTICATED",
      "Please sign in again. Your draft is still here.",
      {},
      401,
    );
  if (
    !supplied ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    throw new ApiError(
      "FORBIDDEN",
      "Your form token is invalid. Refresh your account and retry.",
      {},
      403,
    );
}
export async function rateLimit(
  db: PrismaClient,
  request: Request,
  context: ServiceContext,
  operation: string,
) {
  // Proxy header is considered only after the operator explicitly trusts their ingress.
  const ip =
    process.env.TRUST_PROXY_IP === "true"
      ? (request.headers.get("x-forwarded-for") ?? "anonymous")
          .split(",")[0]
          .trim()
      : "anonymous";
  const identity = context.principal?.userId ?? ip.slice(0, 100);
  const window = Math.floor(context.now.getTime() / 60000);
  const bucket = createHash("sha256")
    .update(`${context.scope}:${identity}:${operation}:${window}`)
    .digest("hex");
  const entry = await db.rateLimitBucket.upsert({
    where: { key: bucket },
    create: { key: bucket, expiresAt: new Date((window + 2) * 60000) },
    update: { count: { increment: 1 } },
  });
  const limit =
    operation === "media.upload"
      ? 12
      : operation === "availability.quote"
        ? 20
        : request.method === "GET"
          ? 120
          : 60;
  if (entry.count > limit)
    throw new ApiError(
      "UNAVAILABLE",
      "Too many requests. Please wait a minute and retry.",
      {},
      429,
    );
}
export async function readJson(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new ApiError("VALIDATION", "Use application/json.", {}, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 65536)
    throw new ApiError("VALIDATION", "Request is too large.", {}, 413);
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        throw new ApiError("VALIDATION", "Request is too large.", {}, 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError("VALIDATION", "Invalid JSON request.", {}, 400);
  }
}
