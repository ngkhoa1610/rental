import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockApi } from "../src/lib/api/mock.ts";
import { createHttpApi } from "../src/lib/api/http.ts";
import { apiRoutes } from "../src/lib/api/http.ts";
import { assertApiOutput } from "../src/lib/api/response-validation.ts";
const now = () => Date.parse("2030-01-01T10:00:00Z");
const setup = () => {
  const backend = createMockApi({ now, latencyMs: 0 });
  return {
    customer: backend.forScope("customer"),
    admin: backend.forScope("admin"),
    staff: backend.forScope("admin"),
  };
};
const denied = (code) => (error) => error.code === code;
const key = () => crypto.randomUUID();
const dates = { pickupDate: "2030-02-01", returnDate: "2030-02-02" };
async function order(customer) {
  customer.signIn("customer");
  const quote = await customer.api.call("availability.quote", {
    ...dates,
    items: [{ productSlug: "muse-dress", quantity: 1 }],
  });
  return customer.api.call("orders.create", {
    quoteId: quote.id,
    notes: "",
    idempotencyKey: key(),
  });
}
test("scopes isolate identities, operations, logout and own orders while sharing store records", async () => {
  const { customer, admin } = setup();
  await assert.rejects(
    admin.api.call("admin.orders.list", undefined),
    denied("UNAUTHENTICATED"),
  );
  assert.throws(() => customer.signIn("admin"), denied("FORBIDDEN"));
  assert.throws(() => admin.signIn("customer"), denied("FORBIDDEN"));
  const created = await order(customer);
  admin.signIn("admin");
  assert.equal(
    (await admin.api.call("admin.orders.list", undefined))[0].id,
    created.id,
  );
  await assert.rejects(
    customer.api.call("admin.orders.list", undefined),
    denied("FORBIDDEN"),
  );
  await assert.rejects(
    admin.api.call("orders.list", undefined),
    denied("FORBIDDEN"),
  );
  await admin.api.call("session.logout", undefined);
  assert.equal(
    (await customer.api.call("session.get", undefined)).profile.id,
    "demo-customer",
  );
  customer.signIn("other-customer");
  assert.equal((await customer.api.call("orders.list", undefined)).length, 0);
  await assert.rejects(
    customer.api.call("orders.get", { orderId: created.id }),
    denied("NOT_FOUND"),
  );
});
test("in-flight requests cannot switch principal", async () => {
  const backend = createMockApi({ latencyMs: 15, now });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  const pending = admin.api.call("admin.products.list", undefined);
  admin.signIn("staff");
  await assert.rejects(pending, denied("UNAUTHENTICATED"));
});
test("product changes validate version, update quotes and cannot undercut held stock", async () => {
  const { customer, admin, staff } = setup();
  const created = await order(customer);
  admin.signIn("admin");
  staff.signIn("staff");
  await assert.rejects(
    staff.api.call("admin.products.list", undefined),
    denied("FORBIDDEN"),
  );
  const products = await admin.api.call("admin.products.list", undefined);
  const product = products.find((p) => p.slug === "muse-dress");
  await admin.api.call("admin.orders.transition", {
    orderId: created.id,
    version: created.version,
    status: "confirmed",
    note: "checked",
    idempotencyKey: key(),
  });
  await assert.rejects(
    admin.api.call("admin.products.save", {
      product: { ...product, quantity: 0 },
      idempotencyKey: key(),
    }),
    denied("UNAVAILABLE"),
  );
  const updated = await admin.api.call("admin.products.save", {
    product: { ...product, name: "<script>escaped</script>", price: 300000 },
    idempotencyKey: key(),
  });
  assert.equal(updated.version, 2);
  await assert.rejects(
    admin.api.call("admin.products.save", { product, idempotencyKey: key() }),
    denied("CONFLICT"),
  );
  assert.equal(
    (
      await customer.api.call("availability.quote", {
        ...dates,
        items: [{ productSlug: product.slug, quantity: 1 }],
      })
    ).total,
    300000,
  );
});
test("inventory blocks enforce stock, affect quote and remove with version checks", async () => {
  const { customer, admin } = setup();
  admin.signIn("admin");
  const input = {
    block: {
      id: "",
      version: 0,
      productSlug: "muse-dress",
      quantity: 2,
      reason: "Cleaning",
      ...dates,
    },
    idempotencyKey: key(),
  };
  const block = await admin.api.call("admin.availability.save", input);
  assert.deepEqual(
    await admin.api.call("admin.availability.save", input),
    block,
  );
  await assert.rejects(
    customer.api.call("availability.quote", {
      ...dates,
      items: [{ productSlug: "muse-dress", quantity: 1 }],
    }),
    denied("UNAVAILABLE"),
  );
  await assert.rejects(
    admin.api.call("admin.availability.save", {
      ...input,
      idempotencyKey: key(),
    }),
    denied("UNAVAILABLE"),
  );
  await admin.api.call("admin.availability.remove", {
    id: block.id,
    version: block.version,
    idempotencyKey: key(),
  });
  assert.ok(
    await customer.api.call("availability.quote", {
      ...dates,
      items: [{ productSlug: "muse-dress", quantity: 1 }],
    }),
  );
});
test("out-of-scope customer and staff endpoints are not mapped to HTTP", async () => {
  const disabled = [
    "orders.change",
    "admin.orders.resolve",
    "admin.payments.list",
    "admin.payments.record",
    "admin.content.list",
    "admin.content.save",
  ];
  for (const operation of disabled)
    assert.equal(apiRoutes[operation], undefined);

  let requests = 0;
  const api = createHttpApi({
    fetcher: async () => {
      requests += 1;
      return new Response("{}", { status: 200 });
    },
    getCsrfToken: () => "csrf",
  });
  await assert.rejects(
    api.call("orders.change", {
      orderId: "order",
      version: 1,
      kind: "cancel",
      reason: "No longer needed",
      idempotencyKey: key(),
    }),
    denied("NOT_FOUND"),
  );
  assert.equal(requests, 0);
});
test("reviews need consent and completed rental; staff cannot moderate", async () => {
  const { admin, staff } = setup();
  admin.signIn("admin");
  admin.seedDemoData();
  admin.seedDemoData();
  staff.signIn("staff");
  assert.equal(
    (await admin.api.call("admin.orders.list", undefined)).length,
    5,
  );
  await assert.rejects(
    staff.api.call("admin.reviews.list", undefined),
    denied("FORBIDDEN"),
  );
  const reviews = await admin.api.call("admin.reviews.list", undefined);
  for (const review of reviews) {
    const call = admin.api.call("admin.reviews.moderate", {
      id: review.id,
      version: review.version,
      decision: "approved",
      note: "checked consent",
      idempotencyKey: key(),
    });
    if (review.consentToPublish)
      assert.equal((await call).moderation, "approved");
    else await assert.rejects(call, denied("VALIDATION"));
  }
});
test("staff permissions apply immediately and owner stays protected", async () => {
  const { admin, staff } = setup();
  admin.signIn("admin");
  staff.signIn("staff");
  admin.seedDemoData();
  const members = await admin.api.call("admin.staff.list", undefined);
  const employee = members.find((m) => m.id === "demo-staff");
  const input = {
    id: employee.id,
    version: employee.version,
    active: true,
    permissions: ["availability:manage"],
    idempotencyKey: key(),
  };
  const updated = await admin.api.call("admin.staff.update", input);
  await assert.rejects(
    staff.api.call("admin.orders.list", undefined),
    denied("FORBIDDEN"),
  );
  assert.ok(await staff.api.call("admin.availability.list", undefined));
  await admin.api.call("admin.staff.update", {
    ...input,
    version: updated.version,
    active: false,
    idempotencyKey: key(),
  });
  await assert.rejects(
    staff.api.call("admin.availability.list", undefined),
    denied("UNAUTHENTICATED"),
  );
  assert.throws(() => staff.signIn("staff"), denied("FORBIDDEN"));
  const owner = members.find((m) => m.id === "demo-admin");
  await assert.rejects(
    admin.api.call("admin.staff.update", {
      ...input,
      id: owner.id,
      version: owner.version,
      idempotencyKey: key(),
    }),
    denied("FORBIDDEN"),
  );
});
test("HTTP scopes use independent session routes and block opposite-area calls before fetch", async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return new Response(
      JSON.stringify({ data: { profile: null, csrfToken: null } }),
      { status: 200 },
    );
  };
  const customer = createHttpApi({
    scope: "customer",
    fetcher,
    getCsrfToken: () => null,
  });
  const admin = createHttpApi({
    scope: "admin",
    fetcher,
    getCsrfToken: () => null,
  });
  await customer.call("session.get", undefined);
  await admin.call("session.get", undefined);
  assert.deepEqual(urls, ["/api/v1/session", "/api/v1/admin/session"]);
  await assert.rejects(
    customer.call("admin.staff.list", undefined),
    denied("FORBIDDEN"),
  );
  await assert.rejects(
    admin.call("orders.list", undefined),
    denied("FORBIDDEN"),
  );
  assert.equal(urls.length, 2);
  assert.throws(
    () => assertApiOutput("admin.products.list", [{ name: "bad" }]),
    denied("INVALID_RESPONSE"),
  );
  assert.throws(
    () =>
      assertApiOutput("admin.staff.list", [
        {
          id: "x",
          name: "x",
          phone: "",
          permissions: ["root"],
          active: true,
          version: 1,
        },
      ]),
    denied("INVALID_RESPONSE"),
  );
});
