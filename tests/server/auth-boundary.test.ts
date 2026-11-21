import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { test } from "node:test";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { handleAuth } from "../../src/server/auth/handler";
import {
  authBoundary,
  principalFromUser,
  type IdentityRecord,
} from "../../src/server/auth/policy";
import {
  requirePermission,
  requireCustomer,
} from "../../src/server/auth/authorization";
import { sessionContext, tokenCookie } from "../../src/server/http/security";
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

test("auth cookie names and base paths are isolated by scope", () => {
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

test("session lookup hashes the cookie and honors scope and expiry", async (t) => {
  const originalSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = randomBytes(32).toString("hex");
  t.after(() => {
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  const token = randomBytes(32).toString("base64url");
  const expectedHash = createHash("sha256").update(token).digest("hex");
  let expires = new Date(Date.now() + 60_000);
  const db = {
    session: {
      async findFirst({
        where,
      }: {
        where: { sessionToken: string; scope: string; expires: { gt: Date } };
      }) {
        assert.equal(where.sessionToken, expectedHash);
        return where.scope === "customer" && expires > where.expires.gt
          ? { id: "s", user: identity }
          : null;
      },
    },
  } as unknown as PrismaClient;
  const request = (scope: "customer" | "admin") =>
    new Request("https://rental.test/api/v1/session", {
      headers: { cookie: `${tokenCookie(scope)}=${token}` },
    });

  const customer = await sessionContext(db, request("customer"), "customer");
  assert.equal(customer.sessionId, "s");
  assert.equal(customer.principal?.userId, "u");
  assert.deepEqual(customer.principal?.permissions, []);
  assert.match(customer.csrfToken ?? "", /^[a-f0-9]{64}$/);
  assert.equal(
    (await sessionContext(db, request("customer"), "admin")).principal,
    null,
  );
  assert.equal(
    (await sessionContext(db, request("admin"), "admin")).principal,
    null,
  );
  expires = new Date(0);
  assert.equal(
    (await sessionContext(db, request("customer"), "customer")).principal,
    null,
  );
});

test("credential handler signs up customers and checks current staff membership before issuing admin sessions", async (t) => {
  const originalOrigin = process.env.APP_ORIGIN;
  const originalSecret = process.env.AUTH_SECRET;
  const origin = "https://rental.test";
  process.env.APP_ORIGIN = origin;
  process.env.AUTH_SECRET = randomBytes(32).toString("hex");
  t.after(() => {
    if (originalOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = originalOrigin;
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  const password = randomBytes(20).toString("base64url");
  const email = "customer@test.invalid";
  type SessionWrite = { scope: string; sessionToken: string; expires: Date };
  let passwordHash: string | undefined;
  let staff: IdentityRecord["staff"] = null;
  let staffVersionAfterRead = 1;
  const sessions: SessionWrite[] = [];
  const db = {
    rateLimitBucket: { upsert: async () => ({ count: 1 }) },
    user: {
      async findUnique({ where }: { where: { email: string } }) {
        return passwordHash && where.email === email
          ? { ...identity, staff, email, passwordHash }
          : null;
      },
      async create({
        data,
      }: {
        data: {
          email: string;
          passwordHash: string;
          sessions: { create: SessionWrite };
        };
      }) {
        assert.equal(data.email, email);
        passwordHash = data.passwordHash;
        sessions.push(data.sessions.create);
        return { ...identity, staff: null, email };
      },
    },
    session: {
      async create({ data }: { data: SessionWrite }) {
        sessions.push(data);
      },
    },
    async $transaction(run: (tx: unknown) => Promise<void>) {
      await run({
        staffProfile: {
          async updateMany({
            where,
          }: {
            where: { userId: string; active: boolean; version: number };
          }) {
            assert.deepEqual(where, {
              userId: identity.id,
              active: true,
              version: staff?.version,
            });
            return { count: Number(where.version === staffVersionAfterRead) };
          },
        },
        session: {
          async create({ data }: { data: SessionWrite & { userId: string } }) {
            assert.equal(data.userId, identity.id);
            sessions.push(data);
          },
        },
      });
    },
  } as unknown as PrismaClient;
  const send = (
    path: string,
    body: Record<string, string>,
    scope: "customer" | "admin" = "customer",
    site = origin,
  ) =>
    handleAuth(
      scope,
      new Request(origin + path, {
        method: "POST",
        headers: { origin: site, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      db,
    );

  const form = {
    name: "Fixture Customer",
    email: email.toUpperCase(),
    password,
  };
  assert.equal(
    (await send("/api/auth/register", form, "customer", "https://other.test"))
      .status,
    403,
  );
  assert.equal(sessions.length, 0);
  const registration = await send("/api/auth/register", form);
  assert.ok(registration.ok, await registration.clone().text());
  assert.deepEqual(await registration.json(), { ok: true });
  assert.ok(passwordHash && passwordHash !== password);
  assert.equal(sessions.length, 1);
  const token = registration.headers
    .get("set-cookie")
    ?.split(";")[0]
    .split("=")[1];
  assert.ok(token);
  assert.equal(
    sessions[0].sessionToken,
    createHash("sha256").update(token).digest("hex"),
  );
  assert.equal(sessions[0].scope, "customer");
  assert.ok(sessions[0].expires > new Date());

  assert.equal(
    (await send("/api/auth/login", { email, password: password + "invalid" }))
      .status,
    401,
  );
  assert.equal(
    (await send("/api/admin/auth/login", { email, password }, "admin")).status,
    401,
  );
  assert.equal(sessions.length, 1);
  const login = await send("/api/auth/login", { email, password });
  assert.ok(login.ok, await login.clone().text());
  assert.equal(sessions.length, 2);
  assert.notEqual(sessions[0].sessionToken, sessions[1].sessionToken);

  staff = identity.staff;
  const adminLogin = await send(
    "/api/admin/auth/login",
    { email, password },
    "admin",
  );
  assert.equal(adminLogin.status, 200);
  assert.ok(
    adminLogin.headers
      .get("set-cookie")
      ?.startsWith(`${tokenCookie("admin")}=`),
  );
  assert.equal(sessions.length, 3);
  assert.equal(sessions[2].scope, "admin");

  staffVersionAfterRead++;
  const staleLogin = await send(
    "/api/admin/auth/login",
    { email, password },
    "admin",
  );
  assert.equal(staleLogin.status, 401);
  assert.equal(staleLogin.headers.get("set-cookie"), null);
  assert.equal(sessions.length, 3);
});
