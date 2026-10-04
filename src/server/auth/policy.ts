import type { ApiScope } from "@/lib/access";
import type { Permission } from "@/lib/api/contracts";
import type { StaffPermission } from "@/generated/prisma/enums";
export const permissionNames: Record<StaffPermission, Permission> = {
  orders_manage: "orders:manage",
  payments_write: "payments:write",
  catalog_manage: "catalog:manage",
  availability_manage: "availability:manage",
  customers_read: "customers:read",
  content_manage: "content:manage",
  reviews_moderate: "reviews:moderate",
  staff_manage: "staff:manage",
};
export interface IdentityRecord {
  id: string;
  active: boolean;
  name: string | null;
  phone: string;
  staff: {
    active: boolean;
    isOwner: boolean;
    permissions: StaffPermission[];
    version: number;
  } | null;
}
export interface Principal {
  userId: string;
  scope: ApiScope;
  permissions: readonly Permission[];
  isOwner: boolean;
}
export function principalFromUser(
  user: IdentityRecord | null,
  scope: ApiScope,
): Principal | null {
  if (!user?.active || (scope === "admin" && !user.staff?.active)) return null;
  return {
    userId: user.id,
    scope,
    permissions:
      scope === "admin" && user.staff
        ? user.staff.permissions.map((p) => permissionNames[p])
        : [],
    isOwner: scope === "admin" && Boolean(user.staff?.isOwner),
  };
}
export function authBoundary(scope: ApiScope, secure: boolean) {
  const name = (part: string) =>
    `${secure ? "__Secure-" : ""}rental.${scope}.${part}`;
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
  };
  return {
    basePath: scope === "admin" ? "/api/admin/auth" : "/api/auth",
    cookies: {
      sessionToken: { name: name("session-token"), options },
      csrfToken: { name: name("csrf-token"), options },
      callbackUrl: { name: name("callback-url"), options },
      pkceCodeVerifier: {
        name: name("pkce-code-verifier"),
        options: { ...options, maxAge: 900 },
      },
      state: { name: name("state"), options: { ...options, maxAge: 900 } },
      nonce: { name: name("nonce"), options },
      webauthnChallenge: {
        name: name("webauthn-challenge"),
        options: { ...options, maxAge: 900 },
      },
    },
  };
}
/** Restrict post-auth destinations to the correct UI boundary and same origin. */
export function authRedirect(
  url: string,
  baseUrl: string,
  scope: ApiScope,
): string {
  const fallback = new URL(scope === "admin" ? "/admin" : "/account", baseUrl)
    .href;
  try {
    const destination = new URL(url, baseUrl);
    if (destination.origin !== new URL(baseUrl).origin) return fallback;
    const admin =
      destination.pathname === "/admin" ||
      destination.pathname.startsWith("/admin/");
    if (
      admin !== (scope === "admin") ||
      destination.pathname.startsWith("/api/")
    )
      return fallback;
    return destination.href;
  } catch {
    return fallback;
  }
}
