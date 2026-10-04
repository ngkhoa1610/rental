import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockApi } from "../src/lib/api/mock.ts";
import { createHttpApi } from "../src/lib/api/http.ts";
import { ApiError } from "../src/lib/api/contracts.ts";

const clock = Date.parse("2030-01-01T10:00:00Z");
const range = { pickupDate: "2030-02-01", returnDate: "2030-02-03" };
const items = [{ productSlug: "muse-dress", quantity: 1 }];
const setup = (options = {}) =>
  createMockApi({ latencyMs: 0, now: () => clock, ...options });
const errorCode = (code) => (error) =>
  error instanceof ApiError && error.code === code;
async function createOrder(mock, key = "create-1", dates = range) {
  const quote = await mock.api.call("availability.quote", { ...dates, items });
  return mock.api.call("orders.create", {
    quoteId: quote.id,
    notes: "Please prepare this look.",
    idempotencyKey: key,
  });
}
const mutation = (order, extra = {}) => ({
  orderId: order.id,
  version: order.version,
  idempotencyKey: crypto.randomUUID(),
  ...extra,
});

test("mock creates a pending unpaid order, snapshots contact, ignores client prices/owner, and clones responses", async () => {
  const mock = setup();
  mock.signIn("customer");
  const quote = await mock.api.call("availability.quote", {
    ...range,
    items,
    total: 1,
    variantId: "fake",
  });
  assert.equal(quote.total, 280000);
  const order = await mock.api.call("orders.create", {
    quoteId: quote.id,
    notes: "<script>text only</script>",
    customerId: "someone-else",
    total: 1,
    idempotencyKey: "create",
  });
  assert.equal(order.customerId, "demo-customer");
  assert.equal(order.status, "pending");
  assert.equal(order.payment.status, "unpaid");
  assert.equal(order.payment.due, 280000);
  await mock.api.call("profile.update", {
    name: "Changed",
    phone: "0911111111",
  });
  order.contact.name = "tampered";
  const stored = await mock.api.call("orders.get", { orderId: order.id });
  assert.equal(stored.contact.name, "Demo customer");
  assert.equal(stored.notes, "<script>text only</script>");
});

test("session and ownership restrict reads/writes, and independent simulators never leak data", async () => {
  const mock = setup();
  await assert.rejects(
    mock.api.call("orders.list", undefined),
    errorCode("UNAUTHENTICATED"),
  );
  mock.signIn("customer");
  const order = await createOrder(mock);
  await assert.rejects(
    mock.api.call("admin.orders.list", undefined),
    errorCode("FORBIDDEN"),
  );
  mock.signIn("other-customer");
  assert.deepEqual(await mock.api.call("orders.list", undefined), []);
  await assert.rejects(
    mock.api.call("orders.get", { orderId: order.id }),
    errorCode("NOT_FOUND"),
  );
  await assert.rejects(
    mock.api.call(
      "orders.change",
      mutation(order, { kind: "cancel", reason: "Try" }),
    ),
    errorCode("NOT_FOUND"),
  );
  const isolated = setup();
  isolated.signIn("customer");
  assert.deepEqual(await isolated.api.call("orders.list", undefined), []);
});

test("profile omissions, invalid dates, unknown products and invalid quantities are rejected", async () => {
  const mock = setup();
  mock.signIn("other-customer");
  await assert.rejects(createOrder(mock), errorCode("VALIDATION"));
  for (const quantity of [0, -1, 1.5, NaN, 101])
    await assert.rejects(
      mock.api.call("availability.quote", {
        ...range,
        items: [{ ...items[0], quantity }],
      }),
      errorCode("VALIDATION"),
    );
  await assert.rejects(
    mock.api.call("availability.quote", {
      ...range,
      items: [...items, ...items],
    }),
    errorCode("VALIDATION"),
  );
  await assert.rejects(
    mock.api.call("availability.quote", {
      ...range,
      items: [{ productSlug: "missing", quantity: 1 }],
    }),
    errorCode("VALIDATION"),
  );
  for (const dates of [
    { pickupDate: "2030-02-30", returnDate: "2030-03-04" },
    { pickupDate: "2029-01-01", returnDate: "2029-01-03" },
    { pickupDate: range.returnDate, returnDate: range.pickupDate },
  ])
    await assert.rejects(
      mock.api.call("availability.quote", { ...dates, items }),
      errorCode("VALIDATION"),
    );
  await assert.rejects(
    mock.api.call("availability.quote", {
      ...range,
      returnDate: "2030-02-05",
      items,
    }),
    errorCode("POLICY_REQUIRED"),
  );
});

test("duplicate submissions replay, changed payload under the same key conflicts, expired quote cannot create", async () => {
  let time = clock;
  const mock = setup({ now: () => time });
  mock.signIn("customer");
  const quote = await mock.api.call("availability.quote", { ...range, items });
  const payload = { quoteId: quote.id, notes: "", idempotencyKey: "retry" };
  const [first, second] = await Promise.all([
    mock.api.call("orders.create", payload),
    mock.api.call("orders.create", payload),
  ]);
  assert.equal(first.id, second.id);
  assert.equal((await mock.api.call("orders.list", undefined)).length, 1);
  await assert.rejects(
    mock.api.call("orders.create", { ...payload, notes: "different" }),
    errorCode("CONFLICT"),
  );
  time += 300001;
  assert.equal((await mock.api.call("orders.create", payload)).id, first.id);
  await assert.rejects(
    mock.api.call("orders.create", { ...payload, idempotencyKey: "new" }),
    errorCode("QUOTE_EXPIRED"),
  );
});

test("parallel confirmations recheck stock atomically and respect inclusive boundary/maintenance", async () => {
  const mock = setup({ stockPerProduct: 1 });
  mock.signIn("customer");
  const first = await createOrder(mock, "first");
  const second = await createOrder(mock, "second");
  mock.signIn("staff");
  const results = await Promise.allSettled(
    [first, second].map((order) =>
      mock.api.call(
        "admin.orders.transition",
        mutation(order, { status: "confirmed", note: "Checked" }),
      ),
    ),
  );
  assert.equal(
    results.filter((value) => value.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.find((value) => value.status === "rejected").reason.code,
    "UNAVAILABLE",
  );
  await assert.rejects(
    mock.api.call("availability.quote", {
      pickupDate: "2030-02-03",
      returnDate: "2030-02-05",
      items,
    }),
    errorCode("UNAVAILABLE"),
  );
  assert.ok(
    await mock.api.call("availability.quote", {
      pickupDate: "2030-02-04",
      returnDate: "2030-02-06",
      items,
    }),
  );
  const blocked = setup({
    blocks: [{ ...range, productSlug: "muse-dress", quantity: 2 }],
  });
  await assert.rejects(
    blocked.api.call("availability.quote", { ...range, items }),
    errorCode("UNAVAILABLE"),
  );
});

test("availability uses peak daily overlap for disjoint reservations", async () => {
  const mock = setup({ stockPerProduct: 2 });
  mock.signIn("customer");
  const first = await createOrder(mock, "a", {
    pickupDate: "2030-02-01",
    returnDate: "2030-02-03",
  });
  const second = await createOrder(mock, "b", {
    pickupDate: "2030-02-05",
    returnDate: "2030-02-07",
  });
  mock.signIn("admin");
  for (const order of [first, second])
    await mock.api.call(
      "admin.orders.transition",
      mutation(order, { status: "confirmed", note: "Checked" }),
    );
  const quote = await mock.api.call("availability.quote", {
    pickupDate: "2030-02-03",
    returnDate: "2030-02-05",
    items,
  });
  assert.equal(quote.lines[0].available, 1);
});

test("change requests wait for staff, check availability again, and preserve payments on cancellation", async () => {
  const mock = setup({ stockPerProduct: 1 });
  mock.signIn("customer");
  let order = await createOrder(mock);
  const blocker = await createOrder(mock, "block", {
    pickupDate: "2030-02-10",
    returnDate: "2030-02-12",
  });
  mock.signIn("admin");
  order = await mock.api.call(
    "admin.orders.transition",
    mutation(order, { status: "confirmed", note: "Checked" }),
  );
  await mock.api.call(
    "admin.orders.transition",
    mutation(blocker, { status: "confirmed", note: "Checked" }),
  );
  mock.signIn("customer");
  order = await mock.api.call(
    "orders.change",
    mutation(order, {
      kind: "dates",
      dates: { pickupDate: "2030-02-10", returnDate: "2030-02-12" },
      reason: "Please move",
    }),
  );
  assert.equal(order.pickupDate, range.pickupDate);
  mock.signIn("admin");
  await assert.rejects(
    mock.api.call(
      "admin.orders.resolve",
      mutation(order, {
        changeId: order.changes[0].id,
        decision: "accepted",
        note: "Check",
      }),
    ),
    errorCode("UNAVAILABLE"),
  );
  order = await mock.api.call(
    "admin.orders.resolve",
    mutation(order, {
      changeId: order.changes[0].id,
      decision: "rejected",
      note: "No stock",
    }),
  );
  mock.signIn("customer");
  order = await mock.api.call(
    "orders.change",
    mutation(order, { kind: "cancel", reason: "Cannot attend" }),
  );
  mock.signIn("admin");
  order = await mock.api.call(
    "admin.orders.resolve",
    mutation(order, {
      changeId: order.changes[1].id,
      decision: "accepted",
      note: "Cancelled",
    }),
  );
  assert.equal(order.status, "cancelled");
  assert.equal(order.payment.status, "unpaid");
});

test("payment permissions, whole-money validation, idempotency and refund ledger are independent of rental status", async () => {
  const mock = setup();
  mock.signIn("customer");
  let order = await createOrder(mock);
  const transaction = mutation(order, {
    kind: "collection",
    amount: 100000,
    occurredAt: new Date(clock).toISOString(),
    note: "Cash received",
  });
  mock.signIn("staff");
  await assert.rejects(
    mock.api.call("admin.payments.record", transaction),
    errorCode("FORBIDDEN"),
  );
  mock.signIn("admin");
  for (const amount of [-1, 0, 1.5, 280001])
    await assert.rejects(
      mock.api.call("admin.payments.record", { ...transaction, amount }),
      errorCode("VALIDATION"),
    );
  order = await mock.api.call("admin.payments.record", transaction);
  assert.equal(order.payment.status, "partial");
  assert.equal(order.status, "pending");
  const replay = await mock.api.call("admin.payments.record", transaction);
  assert.equal(replay.payments.length, 1);
  await assert.rejects(
    mock.api.call("admin.orders.transition", {
      ...mutation(order, { status: "confirmed", note: "Checked" }),
      version: 1,
    }),
    errorCode("CONFLICT"),
  );
  order = await mock.api.call(
    "admin.payments.record",
    mutation(order, {
      kind: "collection",
      amount: 180000,
      occurredAt: new Date(clock).toISOString(),
      note: "Balance",
    }),
  );
  assert.equal(order.payment.status, "paid");
  for (const status of ["confirmed", "renting", "returned", "completed"]) {
    order = await mock.api.call(
      "admin.orders.transition",
      mutation(order, { status, note: "Garment checked" }),
    );
    assert.equal(order.payment.collected, 280000);
  }
  order = await mock.api.call(
    "admin.payments.record",
    mutation(order, {
      kind: "refund",
      amount: 50000,
      occurredAt: new Date(clock).toISOString(),
      note: "Correction after actual refund",
    }),
  );
  assert.equal(order.payment.collected, 280000);
  assert.equal(order.payment.refunded, 50000);
  assert.equal(order.payments.length, 3);
  assert.equal(order.payment.status, "partial");
  await assert.rejects(
    mock.api.call(
      "admin.payments.record",
      mutation(order, {
        kind: "refund",
        amount: 230001,
        occurredAt: new Date(clock).toISOString(),
        note: "Too much",
      }),
    ),
    errorCode("VALIDATION"),
  );
});

test("abort, injected failures and changing identity during a request cannot mutate data", async () => {
  const mock = setup({ latencyMs: 10 });
  mock.signIn("customer");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    mock.api.call("orders.list", undefined, { signal: controller.signal }),
    errorCode("ABORTED"),
  );
  const pending = mock.api.call("orders.list", undefined);
  mock.signIn("admin");
  await assert.rejects(pending, errorCode("UNAUTHENTICATED"));
  mock.failNext();
  await assert.rejects(
    mock.api.call("admin.orders.list", undefined),
    errorCode("NETWORK"),
  );
  assert.deepEqual(await mock.api.call("admin.orders.list", undefined), []);
});

test("HTTP adapter serializes same-origin requests, CSRF and stable idempotency without automatic retries", async () => {
  const calls = [];
  const mock = setup();
  mock.signIn("customer");
  const order = await createOrder(mock);
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

test("same-day and next-day quotes create orders; a pickup that becomes yesterday cannot be submitted", async () => {
  for (const returned of ["2030-02-01", "2030-02-02"]) {
    const mock = setup();
    mock.signIn("customer");
    const order = await createOrder(mock, "same-day", {
      pickupDate: "2030-02-01",
      returnDate: returned,
    });
    assert.equal(order.returnDate, returned);
    assert.equal(
      order.payment.due,
      280000,
      "Fixed illustrative price is not silently prorated",
    );
  }
  let time = Date.parse("2030-01-01T16:59:00Z");
  const mock = setup({ now: () => time });
  mock.signIn("customer");
  const quote = await mock.api.call("availability.quote", {
    items,
    pickupDate: "2030-01-01",
    returnDate: "2030-01-01",
  });
  time += 120000;
  await assert.rejects(
    mock.api.call("orders.create", {
      quoteId: quote.id,
      notes: "",
      idempotencyKey: "midnight",
    }),
    errorCode("VALIDATION"),
  );
});
