import "server-only";
import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  ApiError,
  type OperationName,
  type Permission,
} from "@/lib/api/contracts";
import { scopeAllows } from "@/lib/access";
import { principalFromUser, type Principal } from "@/server/auth/policy";
import {
  requirePermission,
  requireCustomer,
} from "@/server/auth/authorization";
import { serializable } from "@/server/db/transaction";
import type { ServiceContext } from "./services";
export const operationPermission: Partial<Record<OperationName, Permission>> = {
  "admin.products.list": "catalog:manage",
  "admin.products.save": "catalog:manage",
  "admin.availability.list": "availability:manage",
  "admin.availability.save": "availability:manage",
  "admin.availability.remove": "availability:manage",
  "admin.customers.list": "customers:read",
  "admin.content.list": "content:manage",
  "admin.content.save": "content:manage",
  "admin.reviews.list": "reviews:moderate",
  "admin.reviews.moderate": "reviews:moderate",
  "admin.staff.list": "staff:manage",
  "admin.staff.update": "staff:manage",
  "admin.orders.list": "orders:manage",
  "admin.orders.transition": "orders:manage",
  "admin.orders.resolve": "orders:manage",
  "admin.payments.list": "payments:write",
  "admin.payments.record": "payments:write",
};
const publicOperations = new Set<OperationName>([
  "catalog.list",
  "catalog.get",
  "availability.calendar",
  "availability.quote",
  "session.get",
]);
export async function authorize(
  tx: Prisma.TransactionClient,
  op: OperationName,
  context: ServiceContext,
): Promise<Principal | null> {
  if (!scopeAllows(context.scope, op))
    throw new ApiError(
      "FORBIDDEN",
      "This operation belongs to a different workspace.",
    );
  const user = context.principal
    ? await tx.user.findUnique({
        where: { id: context.principal.userId },
        include: { staff: true },
      })
    : null;
  const actor = principalFromUser(user, context.scope);
  if (context.principal && !actor)
    throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
  const permission = operationPermission[op];
  if (permission) requirePermission(actor, permission);
  else if (!publicOperations.has(op) && op !== "session.logout")
    requireCustomer(actor);
  return actor;
}
function canonical(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
    .join(",")}}`;
}
export const fingerprint = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
/** Session scope/actor come from the HTTP boundary, never input JSON. */
export async function mutation<T>(
  db: PrismaClient,
  op: OperationName,
  input: { idempotencyKey: string },
  context: ServiceContext,
  work: (tx: Prisma.TransactionClient, actor: Principal) => Promise<T>,
): Promise<T> {
  return serializable(db, async (tx) => {
    const actor = await authorize(tx, op, context);
    if (!actor) throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
    // Per-user mutation lock prevents duplicate first writes and orders ledger/profile actions.
    // Staff changes lock their target separately; all callers use the same acquisition order.
    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${`${actor.scope}:${actor.userId}:${op}:${input.idempotencyKey}`},0))`,
    );
    const where = {
      actorId_scope_operation_key: {
        actorId: actor.userId,
        scope: actor.scope,
        operation: op,
        key: input.idempotencyKey,
      },
    };
    const prior = await tx.idempotencyRecord.findUnique({ where });
    const hash = fingerprint(input);
    if (prior) {
      if (prior.fingerprint !== hash)
        throw new ApiError(
          "CONFLICT",
          "This request key was already used for different data.",
        );
      // Retain keys even after expiry: no financial action can silently replay as a new write.
      return (prior.response as { value?: T }).value as T;
    }
    const value = await work(tx, actor);
    const response = JSON.parse(
      JSON.stringify(value === undefined ? {} : { value }),
    ) as Prisma.InputJsonObject;
    await tx.idempotencyRecord.create({
      data: {
        actorId: actor.userId,
        scope: actor.scope,
        operation: op,
        key: input.idempotencyKey,
        fingerprint: hash,
        response,
        expiresAt: new Date(context.now.getTime() + 86400000),
      },
    });
    return value;
  });
}
export async function audit(
  tx: Prisma.TransactionClient,
  actor: Principal,
  entity: string,
  entityId: string,
  action: string,
  note: string,
  orderId?: string,
) {
  await tx.auditEvent.create({
    data: {
      actorId: actor.userId,
      scope: actor.scope,
      entity,
      entityId,
      action,
      note,
      ...(orderId ? { orderId } : {}),
    },
  });
}
export function requireVersion(
  record: { version: number } | null,
  expected: number,
) {
  if ((record?.version ?? 0) !== expected)
    throw new ApiError(
      "CONFLICT",
      "This record changed. Refresh it before trying again.",
    );
}
