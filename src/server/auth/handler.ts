import "server-only";
import NextAuth, { type NextAuthResult } from "next-auth";
import { NextRequest } from "next/server";
import type { ApiScope } from "@/lib/access";
import { getDatabase } from "@/server/db/client";
import { createAuthConfig } from "./config";
import { authProviders } from "./providers";
const instances: Partial<Record<ApiScope, NextAuthResult>> = {};
export async function handleAuth(
  scope: ApiScope,
  request: NextRequest,
): Promise<Response> {
  let origin: URL;
  try {
    origin = new URL(process.env.APP_ORIGIN ?? "");
    if (
      origin.origin !== process.env.APP_ORIGIN ||
      !["https:", "http:"].includes(origin.protocol) ||
      (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
    )
      throw new Error();
    if (
      process.env.AUTH_URL &&
      new URL(process.env.AUTH_URL).origin !== origin.origin
    )
      throw new Error();
  } catch {
    return Response.json(
      {
        error: {
          code: "AUTH_NOT_CONFIGURED",
          message: "Configure the public HTTPS origin.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const headers = new Headers(request.headers);
  headers.set("host", origin.host);
  headers.set("x-forwarded-host", origin.host);
  headers.set("x-forwarded-proto", origin.protocol.slice(0, -1));
  request = new NextRequest(
    new URL(request.nextUrl.pathname + request.nextUrl.search, origin),
    {
      method: request.method,
      headers,
      ...(request.method === "POST" ? { body: await request.text() } : {}),
    },
  );
  const providers = authProviders(scope);
  if (
    !providers.length ||
    !process.env.AUTH_SECRET ||
    !process.env.DATABASE_URL
  )
    return Response.json(
      {
        error: {
          code: "AUTH_NOT_CONFIGURED",
          message: "Sign-in is not configured for this workspace.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  const instance =
    instances[scope] ??
    (instances[scope] = NextAuth(
      createAuthConfig(
        getDatabase(),
        scope,
        providers,
        process.env.AUTH_SECRET,
      ),
    ));
  const response =
    await instance.handlers[request.method === "POST" ? "POST" : "GET"](
      request,
    );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
