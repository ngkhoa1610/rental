import "./dom-setup.mjs";
import React from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { RentalRequest } from "../src/components/store/rental-request.tsx";
import { RentalOrders } from "../src/components/store/rental-orders.tsx";
import { AdminOrders } from "../src/components/admin/admin-orders.tsx";
import { createMockApi } from "../src/lib/api/mock.ts";

afterEach(cleanup);
const now = Date.parse("2030-01-01T12:00:00Z");
function setup() {
  const demo = createMockApi({ latencyMs: 0, now: () => now });
  return { demo, runtime: { demo, api: demo.api, setCsrf() {} } };
}
function fillDates() {
  fireEvent.change(screen.getByLabelText("Pickup date"), {
    target: { value: "2030-02-01" },
  });
  fireEvent.change(screen.getByLabelText("Return date"), {
    target: { value: "2030-02-03" },
  });
}

test("request keeps dates/notes through login and expired session, escapes notes and prevents duplicate submission", async () => {
  const { runtime, demo } = setup();
  const user = userEvent.setup();
  const originalUrl = window.location.href;
  render(
    <ApiProvider runtime={runtime}>
      <RentalRequest slugs={["muse-dress"]} />
    </ApiProvider>,
  );
  fillDates();
  fireEvent.change(screen.getByLabelText(/Notes for the store/), {
    target: { value: "<script>keep this</script>" },
  });
  await user.click(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByRole("heading", { name: "Sample quote" });
  assert.ok(screen.getByRole("button", { name: "Send demo request" }).disabled);
  await user.click(
    await screen.findByRole("button", { name: "Try customer account" }),
  );
  await screen.findByRole("button", { name: "Sign out" });
  await user.click(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByRole("button", { name: "Send demo request" });
  demo.expireSession();
  await user.click(screen.getByRole("button", { name: "Send demo request" }));
  await screen.findByRole("alert");
  assert.equal(screen.getByLabelText("Pickup date").value, "2030-02-01");
  assert.equal(
    screen.getByLabelText(/Notes for the store/).value,
    "<script>keep this</script>",
  );
  await user.click(
    screen.getByRole("button", { name: "Try customer account" }),
  );
  await screen.findByRole("button", { name: "Sign out" });
  await user.click(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByRole("button", { name: "Send demo request" });
  await user.dblClick(
    screen.getByRole("button", { name: "Send demo request" }),
  );
  await screen.findByText(/is pending approval/);
  assert.equal((await demo.api.call("orders.list", undefined)).length, 1);
  assert.equal(document.querySelector("script"), null);
  assert.equal(window.location.href, originalUrl);
  await waitFor(() =>
    assert.equal(document.activeElement.getAttribute("role"), "status"),
  );
});

test("changing selection invalidates its quote and failed requests expose retry without losing draft", async () => {
  const { runtime, demo } = setup();
  const user = userEvent.setup();
  const view = render(
    <ApiProvider runtime={runtime}>
      <RentalRequest slugs={["muse-dress"]} />
    </ApiProvider>,
  );
  fillDates();
  // Wait for initial session hydration before injecting the availability failure.
  await screen.findByRole("button", { name: "Try customer account" });
  demo.failNext();
  await user.click(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByRole("alert");
  assert.equal(screen.getByLabelText("Return date").value, "2030-02-03");
  await user.click(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByRole("heading", { name: "Sample quote" });
  view.rerender(
    <ApiProvider runtime={runtime}>
      <RentalRequest slugs={["luna-set"]} />
    </ApiProvider>,
  );
  assert.equal(
    screen.queryByRole("button", { name: "Send demo request" }),
    null,
  );
});

test("staff can confirm but cannot see payment controls; admin records payment without changing rental status", async () => {
  const { runtime, demo } = setup();
  demo.signIn("customer");
  const quote = await demo.api.call("availability.quote", {
    pickupDate: "2030-02-01",
    returnDate: "2030-02-03",
    items: [{ productSlug: "muse-dress", quantity: 1 }],
  });
  const order = await demo.api.call("orders.create", {
    quoteId: quote.id,
    notes: "Handle gently",
    idempotencyKey: "create",
  });
  demo.signIn("staff");
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime}>
      <AdminOrders />
    </ApiProvider>,
  );
  const card = await screen.findByRole("article", {
    name: `Order ${order.id}`,
  });
  assert.equal(within(card).queryByText("Record offline payment"), null);
  await user.click(
    within(card).getByText("Update rental status", { selector: "summary" }),
  );
  await user.type(
    within(card).getByLabelText("Reason / garment condition"),
    "Checked stock",
  );
  await user.click(
    within(card).getByRole("button", { name: "Update rental status" }),
  );
  await within(card).findByText("Confirmed", { selector: ".store-api-badge" });
  assert.ok(within(card).getByText("unpaid"));
  cleanup();
  demo.signIn("admin");
  render(
    <ApiProvider runtime={runtime}>
      <AdminOrders paymentsOnly />
    </ApiProvider>,
  );
  await screen.findByText("Record offline payment", { selector: "summary" });
  const adminCard = await screen.findByRole("article", {
    name: `Order ${order.id}`,
  });
  await user.click(
    within(adminCard).getByText("Record offline payment", {
      selector: "summary",
    }),
  );
  fireEvent.change(within(adminCard).getByLabelText("Amount (VND)"), {
    target: { value: "280000" },
  });
  fireEvent.change(within(adminCard).getByLabelText("Transaction time"), {
    target: { value: "2029-12-31T11:00" },
  });
  await user.type(
    within(adminCard).getByLabelText("Payment note"),
    "Cash collected",
  );
  await user.click(
    within(adminCard).getByRole("button", { name: "Record transaction" }),
  );
  await within(adminCard).findByText("paid", { exact: true });
  assert.ok(
    within(adminCard).getByText("Confirmed", { selector: ".store-api-badge" }),
  );
  cleanup();
  demo.signIn("other-customer");
  render(
    <ApiProvider runtime={runtime}>
      <RentalOrders />
    </ApiProvider>,
  );
  await screen.findByText("No requests yet");
  assert.equal(screen.queryByRole("article"), null);
});
