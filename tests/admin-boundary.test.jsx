import assert from "node:assert/strict";
import { test } from "node:test";
import { createHttpApi } from "../src/lib/api/http.ts";
import { apiRoutes } from "../src/lib/api/http.ts";
import { assertApiOutput } from "../src/lib/api/response-validation.ts";
const denied = (code) => (error) => error.code === code;
const key = () => crypto.randomUUID();

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
