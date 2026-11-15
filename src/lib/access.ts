import type { Permission, Profile } from "./api/contracts";

export type ApiScope = "customer" | "admin";
export const permissions: readonly Permission[] = [
  "orders:manage",
  "catalog:manage",
  "availability:manage",
  "customers:read",
  "reviews:moderate",
  "staff:manage",
];
export const permissionLabels: Partial<Record<Permission, string>> = {
  "orders:manage": "Manage orders",
  "catalog:manage": "Manage products",
  "availability:manage": "Manage availability",
  "customers:read": "View customers",
  "reviews:moderate": "Moderate reviews",
  "staff:manage": "Manage staff",
};
export const adminNavigation: readonly {
  href: string;
  label: string;
  permission?: Permission;
}[] = [
  { href: "/admin", label: "Overview" },
  {
    href: "/admin/orders",
    label: "Rental orders",
    permission: "orders:manage",
  },
  { href: "/admin/products", label: "Products", permission: "catalog:manage" },
  {
    href: "/admin/availability",
    label: "Availability",
    permission: "availability:manage",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    permission: "customers:read",
  },
  { href: "/admin/reviews", label: "Reviews", permission: "reviews:moderate" },
  {
    href: "/admin/team",
    label: "Team & permissions",
    permission: "staff:manage",
  },
];
export const can = (profile: Profile | null, permission?: Permission) =>
  Boolean(
    profile &&
      profile.permissions.length &&
      (!permission || profile.permissions.includes(permission)),
  );
export function scopeAllows(scope: ApiScope, operation: string) {
  if (operation === "session.get" || operation === "session.logout")
    return true;
  return scope === "admin"
    ? operation.startsWith("admin.")
    : !operation.startsWith("admin.");
}
