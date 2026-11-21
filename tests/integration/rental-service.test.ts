import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { test, before, after } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { createServiceApi } from "../../src/server/rental/service";
import { handleRentalRequest } from "../../src/server/http/handler";
import { sessionContext, tokenCookie } from "../../src/server/http/security";
import { principalFromUser } from "../../src/server/auth/policy";
import { handleAuth } from "../../src/server/auth/handler";
import { hashPassword } from "../../src/server/auth/password";
import { uploadMedia, readMedia } from "../../src/server/http/media";
import sharp from "sharp";
import { ApiError, type RentalOrder } from "../../src/lib/api/contracts";
import type { ServiceContext } from "../../src/server/rental/services";
const url = process.env.RENTAL_TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "Run npm run test:integration; this suite never uses a production DB.",
  );
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: url,
    max: process.env.RENTAL_TEST_DB_ENGINE === "pglite" ? 1 : 8,
  }),
});
let customer: ServiceContext, admin: ServiceContext, other: ServiceContext;
const range = { pickupDate: "2030-06-01", returnDate: "2030-06-02" };
const key = () => crypto.randomUUID();
const customerSessionToken = randomBytes(32).toString("base64url");
const rejects = (code: string) => (e: unknown) =>
  e instanceof ApiError && e.code === code;
before(async () => {
  for (const id of ["c", "other", "owner", "staff"])
    await db.user.create({
      data: { id, name: id, phone: "0900000000", email: id + "@test.invalid" },
    });
  await db.staffProfile.create({
    data: {
      userId: "owner",
      isOwner: true,
      permissions: [
        "orders_manage",
        "catalog_manage",
        "availability_manage",
        "customers_read",
        "reviews_moderate",
        "staff_manage",
      ],
    },
  });
  await db.staffProfile.create({
    data: { userId: "staff", permissions: ["orders_manage"] },
  });
  for (const [id, quantity] of [
    ["p", 3],
    ["scarce", 1],
  ] as const)
    await db.product.create({
      data: {
        id,
        slug: id,
        name: id,
        description: "Fixture only",
        category: "Dresses",
        collection: "Tests",
        price: 100000,
        rentalDays: 3,
        quantity,
        visibility: "published",
        images: {
          create: {
            url: "/images/sakura-muse-dress.png",
            alt: "Fixture",
            position: 0,
          },
        },
      },
    });
  async function context(
    id: string,
    scope: "customer" | "admin",
  ): Promise<ServiceContext> {
    const user = await db.user.findUniqueOrThrow({
      where: { id },
      include: { staff: true },
    });
    return {
      principal: principalFromUser(user, scope),
      scope,
      requestId: key(),
      now: new Date("2029-01-01T00:00:00Z"),
    };
  }
  customer = await context("c", "customer");
  other = await context("other", "customer");
  admin = await context("owner", "admin");
});
after(() => db.$disconnect());

test("credential registration, login and logout preserve admin/customer boundaries", async () => {
  const origin = process.env.APP_ORIGIN ?? "";
  const password = randomBytes(20).toString("base64url");
  const email = "new-customer@test.invalid";
  const call = (
    scope: "customer" | "admin",
    action: "login" | "register",
    body: Record<string, unknown>,
    site = origin,
  ) => {
    const prefix = scope === "admin" ? "/api/admin/auth/" : "/api/auth/";
    return handleAuth(
      scope,
      new Request(origin + prefix + action, {
        method: "POST",
        headers: { origin: site, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      db,
    );
  };
  const account = { name: "Fixture Customer", email, password };
  assert.equal(
    (await call("customer", "register", account, "https://other.test")).status,
    403,
  );
  const registered = await call("customer", "register", {
    ...account,
    email: email.toUpperCase(),
  });
  assert.ok(registered.ok, await registered.clone().text());
  const user = await db.user.findUniqueOrThrow({
    where: { email },
    include: { staff: true, sessions: true },
  });
  assert.equal(user.staff, null);
  assert.ok(user.passwordHash && user.passwordHash !== password);
  const cookieHeader = registered.headers.get("set-cookie");
  assert.match(cookieHeader ?? "", /; HttpOnly(?:;|$)/i);
  assert.match(cookieHeader ?? "", /; SameSite=Lax(?:;|$)/i);
  const cookie = cookieHeader?.split(";")[0] ?? "";
  const token = cookie.slice(cookie.indexOf("=") + 1);
  assert.ok(token);
  assert.equal(
    user.sessions[0]?.sessionToken,
    createHash("sha256").update(token).digest("hex"),
  );
  assert.equal(user.sessions[0]?.scope, "customer");
  assert.equal((await call("customer", "register", account)).status, 409);
  assert.equal(
    (await call("customer", "login", { email, password: password + "bad" }))
      .status,
    401,
  );
  assert.equal((await call("admin", "login", { email, password })).status, 401);

  const session = await handleRentalRequest(
    new Request(origin + "/api/v1/session", { headers: { cookie } }),
    ["session"],
    db,
  );
  const { data } = await session.json();
  assert.equal(data.profile.id, user.id);
  const logout = await handleRentalRequest(
    new Request(origin + "/api/v1/session/logout", {
      method: "POST",
      headers: {
        cookie,
        origin,
        "x-csrf-token": data.csrfToken,
        "content-type": "application/json",
      },
      body: "{}",
    }),
    ["session", "logout"],
    db,
  );
  assert.equal(logout.status, 204);
  assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
  assert.ok((await call("customer", "login", { email, password })).ok);

  await db.user.update({
    where: { id: "owner" },
    data: { passwordHash: await hashPassword(password) },
  });
  const staffLogin = await call("admin", "login", {
    email: "owner@test.invalid",
    password,
  });
  assert.ok(staffLogin.ok, await staffLogin.clone().text());
  assert.ok(
    staffLogin.headers
      .get("set-cookie")
      ?.startsWith(tokenCookie("admin") + "="),
  );
});

async function book(ctx = customer, slug = "p", dates = range) {
  const api = createServiceApi(db, ctx);
  const q = await api.call("availability.quote", {
    ...dates,
    items: [{ productSlug: slug, quantity: 1 }],
  });
  return api.call("orders.create", {
    idempotencyKey: key(),
    quoteId: q.id,
    notes: "Fixture",
  });
}
async function transition(order: RentalOrder, status: RentalOrder["status"]) {
  return createServiceApi(db, admin).call("admin.orders.transition", {
    idempotencyKey: key(),
    orderId: order.id,
    version: order.version,
    status,
    note: "Fixture transition",
  });
}

test("runtime validation rejects unknown privilege fields, invalid dates and duplicate lines", async () => {
  const api = createServiceApi(db, customer);
  await assert.rejects(
    api.call("profile.update", {
      name: "c",
      phone: "0900000000",
      isOwner: true,
    } as never),
    rejects("VALIDATION"),
  );
  await assert.rejects(
    api.call("availability.quote", {
      pickupDate: "2030-02-30",
      returnDate: "2030-03-01",
      items: [{ productSlug: "p", quantity: 1 }],
    }),
    rejects("VALIDATION"),
  );
  await assert.rejects(
    api.call("availability.quote", {
      ...range,
      items: [
        { productSlug: "p", quantity: 1 },
        { productSlug: "p", quantity: 1 },
      ],
    }),
    rejects("VALIDATION"),
  );
  await assert.rejects(
    createServiceApi(db, customer, {
      mode: null,
      version: "",
      quoteTtlMs: 300000,
    }).call("availability.quote", {
      ...range,
      items: [{ productSlug: "p", quantity: 1 }],
    }),
    rejects("POLICY_REQUIRED"),
  );
});
test("owned quote creates a pending order snapshot; replay and foreign access are safe", async () => {
  const api = createServiceApi(db, customer);
  const q = await api.call("availability.quote", {
    ...range,
    items: [{ productSlug: "p", quantity: 1 }],
  });
  const input = { idempotencyKey: key(), quoteId: q.id, notes: "Original" };
  await assert.rejects(
    createServiceApi(db, other).call("orders.create", input),
    rejects("NOT_FOUND"),
  );
  const order = await api.call("orders.create", input);
  assert.equal(order.status, "pending");
  assert.ok(!("payment" in order));
  assert.equal((await api.call("orders.create", input)).id, order.id);
  await assert.rejects(
    api.call("orders.create", { ...input, notes: "Different" }),
    rejects("CONFLICT"),
  );
  await api.call("profile.update", {
    name: "New contact",
    phone: "0911111111",
  });
  assert.equal(
    (await api.call("orders.get", { orderId: order.id })).contact.name,
    "c",
  );
  await assert.rejects(
    createServiceApi(db, other).call("orders.get", { orderId: order.id }),
    rejects("NOT_FOUND"),
  );
});
test("simultaneous duplicate submission returns one order", async () => {
  const api = createServiceApi(db, customer);
  const q = await api.call("availability.quote", {
    ...range,
    items: [{ productSlug: "p", quantity: 1 }],
  });
  const input = { idempotencyKey: key(), quoteId: q.id, notes: "" };
  const results = await Promise.all([
    api.call("orders.create", input),
    api.call("orders.create", input),
  ]);
  assert.equal(results[0].id, results[1].id);
  assert.equal(await db.rentalOrder.count({ where: { quoteId: q.id } }), 1);
});
test("competing approvals cannot reserve the same last item", async () => {
  const a = await book(customer, "scarce"),
    b = await book(other, "scarce");
  const outcomes = await Promise.allSettled([
    transition(a, "confirmed"),
    transition(b, "confirmed"),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    await db.rentalOrder.count({
      where: { status: "confirmed", lines: { some: { productId: "scarce" } } },
    }),
    1,
  );
});
test("catalog/block version and peak stock protect existing commitments", async () => {
  const a = createServiceApi(db, admin);
  const product = (await a.call("admin.products.list", undefined)).find(
    (p) => p.slug === "scarce",
  );
  assert.ok(product);
  await assert.rejects(
    a.call("admin.products.save", {
      idempotencyKey: key(),
      product: { ...product, quantity: 0 },
    }),
    rejects("UNAVAILABLE"),
  );
  await assert.rejects(
    a.call("admin.availability.save", {
      idempotencyKey: key(),
      block: {
        id: "",
        productSlug: "scarce",
        ...range,
        quantity: 1,
        version: 0,
        reason: "Clean",
      },
    }),
    rejects("UNAVAILABLE"),
  );
  const block = await a.call("admin.availability.save", {
    idempotencyKey: key(),
    block: {
      id: "",
      productSlug: "p",
      pickupDate: "2030-09-01",
      returnDate: "2030-09-01",
      quantity: 1,
      version: 0,
      reason: "Clean",
    },
  });
  await a.call("admin.availability.remove", {
    idempotencyKey: key(),
    id: block.id,
    version: block.version,
  });
  assert.equal(await db.inventoryBlock.count({ where: { id: block.id } }), 0);
});
test("staff revoke enforces server permissions", async () => {
  const a = createServiceApi(db, admin);
  await assert.rejects(
    a.call("admin.staff.update", {
      idempotencyKey: key(),
      id: "owner",
      version: 1,
      active: false,
      permissions: [],
    }),
    rejects("FORBIDDEN"),
  );
  await a.call("admin.staff.update", {
    idempotencyKey: key(),
    id: "staff",
    version: 1,
    active: false,
    permissions: [],
  });
  const staffUser = await db.user.findUniqueOrThrow({
    where: { id: "staff" },
    include: { staff: true },
  });
  const ctx = { ...admin, principal: principalFromUser(staffUser, "admin") };
  await assert.rejects(
    createServiceApi(db, ctx).call("admin.orders.list", undefined),
    rejects("UNAUTHENTICATED"),
  );
});
test("HTTP validates sessions/CSRF/origin/method and rate-limits without leaking data", async () => {
  await db.session.create({
    data: {
      id: "cs",
      sessionToken: createHash("sha256")
        .update(customerSessionToken)
        .digest("hex"),
      userId: "c",
      scope: "customer",
      expires: new Date(Date.now() + 3600000),
    },
  });
  const origin = process.env.APP_ORIGIN ?? "";
  const cookie = `${tokenCookie("customer")}=${customerSessionToken}`;
  const get = new Request(origin + "/api/v1/session", { headers: { cookie } });
  const session = await handleRentalRequest(get, ["session"], db);
  assert.equal(session.status, 200);
  const value = await session.json();
  assert.ok(value.data.csrfToken);
  assert.match(session.headers.get("cache-control") ?? "", /no-store/);
  const cross = await handleRentalRequest(
    new Request(origin + "/api/v1/admin/orders", { headers: { cookie } }),
    ["admin", "orders"],
    db,
  );
  assert.equal(cross.status, 401);
  const input = { name: "HTTP customer", phone: "0900000000" };
  for (const [site, token, status] of [
    ["https://evil.invalid", value.data.csrfToken, 403],
    [origin, "bad", 403],
    [origin, value.data.csrfToken, 200],
  ] as const) {
    const res = await handleRentalRequest(
      new Request(origin + "/api/v1/me/profile", {
        method: "PATCH",
        headers: {
          cookie,
          origin: site,
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify(input),
      }),
      ["me", "profile"],
      db,
    );
    assert.equal(res.status, status);
  }
  assert.equal(
    (
      await handleRentalRequest(
        new Request(origin + "/api/v1/me/profile"),
        ["me", "profile"],
        db,
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await handleRentalRequest(
        new Request(origin + "/api/v1/unknown"),
        ["unknown"],
        db,
      )
    ).status,
    404,
  );
  const context = await sessionContext(db, get, "customer");
  assert.equal(context.principal?.scope, "customer");
});

test("review photos stay private until completed owner review, consent and moderation", async () => {
  let order = await book(customer, "p", {
    pickupDate: "2030-11-01",
    returnDate: "2030-11-02",
  });
  for (const status of [
    "confirmed",
    "renting",
    "returned",
    "completed",
  ] as const)
    order = await transition(order, status);
  const origin = process.env.APP_ORIGIN ?? "";
  const cookie = `${tokenCookie("customer")}=${customerSessionToken}`;
  const session = await handleRentalRequest(
    new Request(origin + "/api/v1/session", { headers: { cookie } }),
    ["session"],
    db,
  );
  const csrf = (await session.json()).data.csrfToken as string;
  const bytes = await sharp({
    create: { width: 12, height: 12, channels: 3, background: "#e7adc2" },
  })
    .png()
    .toBuffer();
  const uploaded = await uploadMedia(
    new Request(origin + "/api/v1/me/reviews/media", {
      method: "POST",
      headers: {
        cookie,
        origin,
        "x-csrf-token": csrf,
        "x-order-id": order.id,
        "content-type": "image/png",
      },
      body: bytes,
    }),
    db,
  );
  assert.equal(uploaded.status, 201);
  const id = (await uploaded.json()).data.id as string;
  assert.equal(
    (await readMedia(new Request(origin + "/media/" + id), id, db)).status,
    404,
  );
  assert.equal(
    (
      await readMedia(
        new Request(origin + "/media/" + id, { headers: { cookie } }),
        id,
        db,
      )
    ).status,
    200,
  );
  const review = await createServiceApi(db, customer).call("reviews.create", {
    idempotencyKey: key(),
    orderId: order.id,
    rating: 5,
    story: "Ảnh thực tế",
    consentToPublish: true,
    mediaIds: [id],
  });
  assert.equal(review.moderation, "pending");
  assert.equal(
    (await readMedia(new Request(origin + "/media/" + id), id, db)).status,
    404,
  );
  await assert.rejects(
    createServiceApi(db, other).call("reviews.create", {
      idempotencyKey: key(),
      orderId: order.id,
      rating: 5,
      story: "Foreign",
      consentToPublish: true,
      mediaIds: [],
    }),
    rejects("NOT_FOUND"),
  );
  await createServiceApi(db, admin).call("admin.reviews.moderate", {
    idempotencyKey: key(),
    id: review.id,
    version: review.version,
    decision: "approved",
    note: "Verified fixture",
  });
  const publicPhoto = await readMedia(
    new Request(origin + "/media/" + id),
    id,
    db,
  );
  assert.equal(publicPhoto.status, 200);
  assert.equal(publicPhoto.headers.get("content-type"), "image/webp");
  assert.match(publicPhoto.headers.get("cache-control") ?? "", /no-store/);
});

test("published catalog projects customer fields and media ownership remains isolated", async () => {
  const a = createServiceApi(db, admin);
  const managed = (await a.call("admin.products.list", undefined)).find(
    (p) => p.slug === "p",
  );
  assert.ok(managed);
  const customerProduct = await createServiceApi(db, customer).call(
    "catalog.get",
    { slug: "p" },
  );
  assert.equal("quantity" in customerProduct, false);
  assert.equal("version" in customerProduct, false);
  assert.equal("visibility" in customerProduct, false);
  const saved = await a.call("admin.products.save", {
    idempotencyKey: key(),
    product: { ...managed, visibility: "draft" },
  });
  assert.equal(saved.visibility, "draft");
  await assert.rejects(
    createServiceApi(db, customer).call("catalog.get", { slug: "p" }),
    rejects("NOT_FOUND"),
  );
  await a.call("admin.products.save", {
    idempotencyKey: key(),
    product: { ...saved, visibility: "published" },
  });
});
