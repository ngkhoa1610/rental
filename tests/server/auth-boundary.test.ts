import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { scopedPrismaAdapter } from "../../src/server/auth/scoped-adapter";
import {
  authBoundary,
  authRedirect,
  principalFromUser,
  type IdentityRecord,
} from "../../src/server/auth/policy";
import {
  requirePermission,
  requireCustomer,
} from "../../src/server/auth/authorization";
import { createAuthConfig } from "../../src/server/auth/config";
const identity: IdentityRecord = {
  id: "u",
  name: "Staff",
  phone: "0900000000",
  active: true,
  staff: {
    active: true,
    isOwner: false,
    permissions: ["orders_manage"],
    version: 1,
  },
};

test("auth cookies/base paths and redirects cannot cross customer/admin or external origins", () => {
  const customer = authBoundary("customer", true),
    admin = authBoundary("admin", true);
  assert.notEqual(customer.basePath, admin.basePath);
  const names = new Set(Object.values(customer.cookies).map((c) => c.name));
  for (const cookie of Object.values(admin.cookies)) {
    assert.ok(!names.has(cookie.name));
    assert.ok(cookie.options.httpOnly);
    assert.ok(cookie.options.secure);
    assert.equal(cookie.options.sameSite, "lax");
  }
  for (const url of [
    "https://evil.invalid/admin",
    "//evil.invalid/admin",
    "/account",
    "/api/auth/session",
  ])
    assert.equal(
      authRedirect(url, "https://rental.test", "admin"),
      "https://rental.test/admin",
    );
  assert.equal(
    authRedirect("/admin/orders", "https://rental.test", "customer"),
    "https://rental.test/account",
  );
  assert.equal(
    authRedirect("/account/orders", "https://rental.test", "customer"),
    "https://rental.test/account/orders",
  );
});
test("principals drop staff permissions on customer scope and reject disabled membership", () => {
  const customer = principalFromUser(identity, "customer");
  assert.deepEqual(customer?.permissions, []);
  assert.equal(customer?.isOwner, false);
  const admin = principalFromUser(identity, "admin");
  assert.ok(admin);
  requirePermission(admin, "orders:manage");
  assert.throws(() => requirePermission(admin, "payments:write"));
  assert.throws(() => requireCustomer(admin));
  assert.equal(
    principalFromUser({ ...identity, active: false }, "customer"),
    null,
  );
  assert.equal(
    principalFromUser(
      { ...identity, staff: { ...identity.staff!, active: false } },
      "admin",
    ),
    null,
  );
});

test("adapter session read/update/delete filters scope; refresh cannot change owner", async () => {
  const calls: unknown[] = [];
  const record = {
    id: "s",
    sessionToken: "token",
    userId: "u",
    expires: new Date(Date.now() + 3600000),
    scope: "customer",
    user: {
      ...identity,
      email: "u@test.invalid",
      emailVerified: null,
      image: null,
    },
  };
  const db = {
    session: {
      findFirst: async (args: { where: { scope: string } }) => {
        calls.push(args);
        return args.where.scope === record.scope ? record : null;
      },
      updateMany: async (args: unknown) => {
        calls.push(args);
        return { count: 1 };
      },
      deleteMany: async (args: unknown) => {
        calls.push(args);
        return { count: 1 };
      },
    },
  } as unknown as PrismaClient;
  const admin = scopedPrismaAdapter(db, "admin"),
    customer = scopedPrismaAdapter(db, "customer");
  assert.equal(await admin.getSessionAndUser!("token"), null);
  assert.equal(
    await admin.updateSession!({ sessionToken: "token", userId: "intruder" }),
    null,
  );
  const result = await customer.updateSession!({
    sessionToken: "token",
    userId: "intruder",
  });
  assert.equal(result?.userId, "u");
  await admin.deleteSession!("token");
  assert.deepEqual(calls.at(-1), {
    where: { sessionToken: "token", scope: "admin" },
  });
  assert.deepEqual(calls[3], {
    where: { id: "s", scope: "customer" },
    data: {},
  });
});
test("admin auth cannot grant membership using unlinked email or provider profile", async () => {
  const db = {
    account: { findUnique: async () => null },
    user: { findUnique: async () => identity },
  } as unknown as PrismaClient;
  const config = createAuthConfig(
    db,
    "admin",
    [],
    "fixture-only-not-used-to-sign",
  );
  const signIn = config.callbacks!.signIn!;
  const result = await signIn({
    user: { id: "u", email: "u@test.invalid" },
    account: {
      provider: "example",
      providerAccountId: "external",
      type: "oauth",
    },
    profile: { email: "u@test.invalid", role: "admin" },
  });
  assert.equal(result, false);
});
