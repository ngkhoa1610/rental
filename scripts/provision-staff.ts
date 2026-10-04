/** Server operator only; no public bootstrap or role from provider claims. */
import "dotenv/config";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { Prisma } from "../src/generated/prisma/client";
import { getDatabase } from "../src/server/db/client";
import { serializable } from "../src/server/db/transaction";
import { permissionNames } from "../src/server/auth/policy";
async function main() {
  const { values } = parseArgs({
    options: {
      "user-id": { type: "string" },
      subject: { type: "string" },
      role: { type: "string" },
      permissions: { type: "string" },
    },
  });
  const userId = values["user-id"],
    subject = values.subject,
    role = values.role,
    issuer = process.env.AUTH_ADMIN_OIDC_ISSUER;
  if (
    !userId ||
    !subject ||
    subject.length > 255 ||
    !["owner", "staff"].includes(role ?? "") ||
    !issuer ||
    new URL(issuer).protocol !== "https:"
  )
    throw new Error(
      "Required: --user-id EXISTING_DB_ID --subject VERIFIED_OIDC_SUB --role owner|staff and AUTH_ADMIN_OIDC_ISSUER.",
    );
  const names = Object.keys(
      permissionNames,
    ) as (keyof typeof permissionNames)[],
    chosen = (values.permissions ?? "").split(",").filter(Boolean);
  if (
    chosen.some(
      (p) =>
        !Object.values(permissionNames).some((v) => v === p) ||
        p === "staff:manage",
    )
  )
    throw new Error(
      "Use task permissions only; staff:manage is reserved for owner.",
    );
  const db = getDatabase();
  try {
    await serializable(db, async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended('rental-staff-provision',0))`,
      );
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { staff: true },
      });
      if (!user?.active || user.staff)
        throw new Error(
          "An active user without staff access is required. Use admin UI for later changes.",
        );
      if (
        role === "owner" &&
        (await tx.staffProfile.count({ where: { isOwner: true } }))
      )
        throw new Error("Owner already exists.");
      const provider =
          "oidc-" +
          createHash("sha256").update(issuer).digest("hex").slice(0, 16),
        account = await tx.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId: subject,
            },
          },
        });
      if (account && account.userId !== userId)
        throw new Error("Provider subject belongs to another user.");
      if (!account)
        await tx.account.create({
          data: { userId, provider, providerAccountId: subject, type: "oidc" },
        });
      await tx.staffProfile.create({
        data: {
          userId,
          isOwner: role === "owner",
          permissions:
            role === "owner"
              ? names
              : names.filter((n) => chosen.includes(permissionNames[n])),
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: userId,
          scope: "admin",
          entity: "staff",
          entityId: userId,
          action: "Staff provisioned by operator",
          note: "Identity verified by operator; initial " + role,
        },
      });
    });
    console.log("Staff provisioned. Sign in separately at /admin/login.");
  } finally {
    await db.$disconnect();
  }
}
void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Provisioning failed.",
  );
  process.exitCode = 1;
});
