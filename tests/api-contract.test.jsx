import assert from "node:assert/strict";
import { test } from "node:test";
import { createHttpApi } from "../src/lib/api/http.ts";
import { ApiError } from "../src/lib/api/contracts.ts";

const errorCode = (code) => (error) =>
  error instanceof ApiError && error.code === code;

test("HTTP adapter serializes same-origin requests, CSRF and stable idempotency without automatic retries", async () => {
  const calls = [];
  const order = {
    id: "order-1",
    customerId: "customer-1",
    contact: { name: "Customer", phone: "0900000000" },
    pickupDate: "2030-02-01",
    returnDate: "2030-02-03",
    lines: [
      {
        productSlug: "muse-dress",
        name: "Muse Dress",
        quantity: 1,
        amount: 280000,
        available: 2,
      },
    ],
    notes: "",
    status: "pending",
    version: 1,
    createdAt: "2030-01-01T12:00:00.000Z",
    changes: [],
    history: [],
  };
  const api = createHttpApi({
    getCsrfToken: () => "csrf",
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ data: order });
    },
  });
  await api.call("orders.create", {
    quoteId: "q",
    notes: "Hi",
    idempotencyKey: "stable-key",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/v1/me/orders");
  assert.equal(calls[0].init.headers["X-CSRF-Token"], "csrf");
  assert.equal(calls[0].init.headers["Idempotency-Key"], "stable-key");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.redirect, "error");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    quoteId: "q",
    notes: "Hi",
  });
  assert.throws(() =>
    createHttpApi({
      basePath: "https://external.example",
      getCsrfToken: () => null,
    }),
  );
});

test("HTTP validates response shapes, maps service errors, missing CSRF, network/abort/timeout", async () => {
  const make = (fetcher, extra = {}) =>
    createHttpApi({ fetcher, getCsrfToken: () => "csrf", ...extra });
  await assert.rejects(
    make(async () => Response.json({ data: { profile: { id: "bad" } } })).call(
      "session.get",
      undefined,
    ),
    errorCode("INVALID_RESPONSE"),
  );
  await assert.rejects(
    make(async () => new Response("<html>failure</html>")).call(
      "orders.list",
      undefined,
    ),
    errorCode("INVALID_RESPONSE"),
  );
  await assert.rejects(
    make(async () =>
      Response.json(
        { error: { code: "UNAVAILABLE", message: "Sold out" } },
        { status: 409 },
      ),
    ).call("orders.create", { quoteId: "q", notes: "", idempotencyKey: "k" }),
    errorCode("UNAVAILABLE"),
  );
  await assert.rejects(
    make(async () => {
      throw new TypeError("network");
    }).call("session.get", undefined),
    errorCode("NETWORK"),
  );
  await assert.rejects(
    make(
      async () => {
        throw new Error("Should not fetch");
      },
      { getCsrfToken: () => null },
    ).call("session.logout", undefined),
    errorCode("UNAUTHENTICATED"),
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    make(async (_url, { signal }) => {
      signal.throwIfAborted();
    }).call("session.get", undefined, { signal: controller.signal }),
    errorCode("ABORTED"),
  );
  await assert.rejects(
    make(
      async (_url, { signal }) => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        signal.throwIfAborted();
      },
      { timeoutMs: 1 },
    ).call("session.get", undefined),
    errorCode("TIMEOUT"),
  );
});
