/** Server operator only. Staff credentials are provisioned separately from customer registration. */
import "dotenv/config";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { parseArgs } from "node:util";
import { permissions } from "../src/lib/access";
import { Prisma } from "../src/generated/prisma/client";
import { getDatabase } from "../src/server/db/client";
import { serializable } from "../src/server/db/transaction";
import { permissionNames } from "../src/server/auth/policy";
import {
  credentialEmail,
  hashPassword,
  newPassword,
} from "../src/server/auth/password";

class ProvisioningError extends Error {}

async function readPassword(prompt: string) {
  if (!process.stdin.isTTY)
    throw new ProvisioningError("Run this command in an interactive terminal.");
  process.stderr.write(prompt);
  const hiddenOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const terminal = createInterface({
    input: process.stdin,
    output: hiddenOutput,
    terminal: true,
    historySize: 0,
  });
  try {
    return await new Promise<string>((resolve, reject) => {
      terminal.once("line", resolve);
      terminal.once("close", () =>
        reject(new ProvisioningError("Provisioning canceled.")),
      );
      terminal.once("SIGINT", () => terminal.close());
    });
  } finally {
    terminal.close();
    process.stderr.write("\n");
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      role: { type: "string" },
      permissions: { type: "string" },
    },
  });
  const parsedEmail = credentialEmail.safeParse(values.email);
  const name = values.name?.trim();
  const role = values.role;
  if (
    !parsedEmail.success ||
    !name ||
    name.length > 100 ||
    (role !== "owner" && role !== "staff")
  )
    throw new ProvisioningError(
      "Required: --email EMAIL --name NAME --role owner|staff.",
    );
  const email = parsedEmail.data;
  const names = (
    Object.keys(permissionNames) as (keyof typeof permissionNames)[]
  ).filter((name) => permissions.includes(permissionNames[name]));
  const chosen = (values.permissions ?? "")
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  if (
    chosen.some(
      (p) =>
        !permissions.some((permission) => permission === p) ||
        p === "staff:manage",
    )
  )
    throw new ProvisioningError(
      "Use task permissions only; staff:manage is reserved for owner.",
    );
  const password = await readPassword("Password: ");
  if (!newPassword.safeParse(password).success)
    throw new ProvisioningError("Use a password from 15 to 128 characters.");
  const confirmation = await readPassword("Confirm password: ");
  if (password !== confirmation)
    throw new ProvisioningError("Passwords do not match.");
  const passwordHash = await hashPassword(password);
  const db = getDatabase();
  try {
    await serializable(db, async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended('rental-staff-provision',0))`,
      );
      if (await tx.user.findUnique({ where: { email }, select: { id: true } }))
        throw new ProvisioningError("A user already uses this email.");
      if (
        role === "owner" &&
        (await tx.staffProfile.count({ where: { isOwner: true } }))
      )
        throw new ProvisioningError("Owner already exists.");
      const { id: userId } = await tx.user.create({
        data: { email, name, passwordHash },
        select: { id: true },
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
          note: "Initial role: " + role,
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
    error instanceof ProvisioningError
      ? error.message
      : "Provisioning failed. Check the database configuration and migration status.",
  );
  process.exitCode = 1;
});
