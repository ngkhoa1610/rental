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
  return {
    basePath: scope === "admin" ? "/api/admin/auth" : "/api/auth",
    cookies: {
      sessionToken: {
        name: `${secure ? "__Secure-" : ""}rental.${scope}.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure,
        },
      },
    },
  };
}
