import "server-only";
import { createHash } from "node:crypto";
import type { NextAuthConfig } from "next-auth";
import type { ApiScope } from "@/lib/access";
/** Generic OIDC configuration; the operator chooses the provider, no demo identity. */
export function authProviders(scope: ApiScope): NextAuthConfig["providers"] {
  const prefix = scope === "admin" ? "AUTH_ADMIN_OIDC" : "AUTH_CUSTOMER_OIDC";
  const issuer = process.env[`${prefix}_ISSUER`],
    clientId = process.env[`${prefix}_CLIENT_ID`],
    clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!issuer || !clientId || !clientSecret) return [];
  let url: URL;
  try {
    url = new URL(issuer);
  } catch {
    return [];
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    return [];
  // Bind provider namespace to issuer to avoid subject collisions across identity providers.
  const id = `oidc-${createHash("sha256").update(issuer).digest("hex").slice(0, 16)}`;
  return [
    {
      id,
      name: process.env[`${prefix}_NAME`] ?? "Tài khoản cửa hàng",
      type: "oidc",
      issuer,
      clientId,
      clientSecret,
      checks: ["pkce", "state", "nonce"],
      authorization: { params: { scope: "openid email profile" } },
      profile(profile) {
        if (
          typeof profile.sub !== "string" ||
          typeof profile.email !== "string" ||
          profile.email_verified !== true
        )
          throw new Error("A verified provider email is required.");
        return {
          id: profile.sub,
          email: profile.email,
          name: typeof profile.name === "string" ? profile.name : null,
          image: null,
        };
      },
    },
  ];
}
