import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { ApiError, type Permission } from "@/lib/api/contracts";
import { principalFromUser, type Principal } from "./policy";
import type { ApiScope } from "@/lib/access";

/** Invoke from authenticated service entrypoints, never trust client role/userId. */
export async function resolvePrincipal(
  db: PrismaClient,
  userId: string,
  scope: ApiScope,
): Promise<Principal> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { staff: true },
  });
  const principal = principalFromUser(user, scope);
  if (!principal)
    throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
  return principal;
}
export function requirePermission(
  principal: Principal | null,
  permission: Permission,
): asserts principal is Principal {
  if (!principal)
    throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
  if (
    principal.scope !== "admin" ||
    !principal.permissions.includes(permission)
  )
    throw new ApiError("FORBIDDEN", "Your account cannot perform this action.");
}
export function requireCustomer(
  principal: Principal | null,
): asserts principal is Principal {
  if (!principal)
    throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
  if (principal.scope !== "customer")
    throw new ApiError("FORBIDDEN", "This action requires a customer session.");
}
