import "./dom-setup.mjs";
import React, { useState } from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  monthDates,
  rangeDates,
  shiftMonth,
} from "../src/lib/rental-calendar.ts";
import { contactHref, requestNotes } from "../src/lib/store-details.ts";
import { createMockApi } from "../src/lib/api/mock.ts";
import { createHttpApi } from "../src/lib/api/http.ts";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { AvailabilityCalendar } from "../src/components/store/availability-calendar.tsx";
import { RentalRequest } from "../src/components/store/rental-request.tsx";
import { BookingConfirmation } from "../src/components/store/booking-confirmation.tsx";
const clock = Date.parse("2030-01-01T10:00:00Z");
const setup = (options = {}) =>
  createMockApi({ latencyMs: 0, now: () => clock, ...options });
const runtime = (demo) => ({ demo, api: demo.api, setCsrf() {} });
afterEach(cleanup);

test("month/range helpers handle leap years, year boundaries, same-day and invalid dates", () => {
  assert.equal(monthDates("2028-02").length, 29);
  assert.equal(monthDates("2030-02").length, 28);
  for (const invalid of ["2030-13", "2030-2", "1999-12", "2101-01"])
    assert.deepEqual(monthDates(invalid), []);
  assert.equal(shiftMonth("2030-12", 1), "2031-01");
  assert.deepEqual(rangeDates("2030-02-01", "2030-02-01"), ["2030-02-01"]);
  assert.deepEqual(rangeDates("2030-02-30", "2030-03-01"), []);
  assert.deepEqual(rangeDates("2030-03-02", "2030-03-01"), []);
});

test("public monthly availability uses shared stock without customer/admin data and rejects invalid reads", async () => {
  const demo = setup({
    blocks: [
      {
        productSlug: "muse-dress",
        pickupDate: "2030-02-02",
        returnDate: "2030-02-02",
        quantity: 2,
      },
    ],
  });
  const month = await demo.api.call("availability.calendar", {
    productSlug: "muse-dress",
    month: "2030-02",
  });
  assert.deepEqual(Object.keys(month).sort(), [
    "checkedAt",
    "days",
    "month",
    "productSlug",
  ]);
  assert.equal(month.days[0].available, 2);
  assert.equal(month.days[1].available, 0);
  assert.deepEqual(Object.keys(month.days[0]).sort(), ["available", "date"]);
  await assert.rejects(
    demo.api.call("availability.quote", {
      items: [{ productSlug: "muse-dress", quantity: 1 }],
      pickupDate: "2030-02-01",
      returnDate: "2030-02-03",
    }),
    (e) => e.code === "UNAVAILABLE",
  );
  await assert.rejects(
    demo.api.call("availability.calendar", {
      productSlug: "muse-dress",
      month: "2030-99",
    }),
    (e) => e.code === "VALIDATION",
  );
  await assert.rejects(
    demo.api.call("availability.calendar", {
      productSlug: "missing",
      month: "2030-02",
    }),
    (e) => e.code === "NOT_FOUND",
  );
});

test("HTTP calendar is same-origin no-store and rejects incomplete, reordered or negative stock DTOs", async () => {
  const valid = await setup().api.call("availability.calendar", {
    productSlug: "muse-dress",
    month: "2030-02",
  });
  let payload = valid;
  const api = createHttpApi({
    scope: "customer",
    getCsrfToken: () => null,
    fetcher: async (url, init) => {
      assert.equal(
        url,
        "/api/v1/availability/calendar?productSlug=muse-dress&month=2030-02",
      );
      assert.equal(init.cache, "no-store");
      assert.equal(init.credentials, "same-origin");
      assert.equal(init.method, "GET");
      return new Response(JSON.stringify({ data: payload }), { status: 200 });
    },
  });
  const input = { productSlug: "muse-dress", month: "2030-02" };
  assert.deepEqual(await api.call("availability.calendar", input), valid);
  for (const days of [
    valid.days.slice(1),
    [...valid.days].reverse(),
    valid.days.map((day, i) => (i ? day : { ...day, available: -1 })),
    valid.days.map((day, i) => (i ? day : { ...day, available: 0.5 })),
  ]) {
    payload = { ...valid, days };
    await assert.rejects(
      api.call("availability.calendar", input),
      (e) => e.code === "INVALID_RESPONSE",
    );
  }
});

function CalendarHarness() {
  const [dates, setDates] = useState({
    pickupDate: "2030-02-01",
    returnDate: "2030-02-01",
  });
  return (
    <>
      <AvailabilityCalendar
        slug="muse-dress"
        dates={dates}
        onChange={setDates}
      />
      <output data-testid="dates">
        {dates.pickupDate}/{dates.returnDate}
      </output>
    </>
  );
}
test("calendar disables sold-out dates and rejects a range crossing them while permitting same-day", async () => {
  const demo = setup({
    blocks: [
      {
        productSlug: "muse-dress",
        pickupDate: "2030-02-02",
        returnDate: "2030-02-02",
        quantity: 2,
      },
    ],
  });
  render(
    <ApiProvider runtime={runtime(demo)}>
      <CalendarHarness />
    </ApiProvider>,
  );
  await waitFor(() =>
    assert.equal(
      screen.getByRole("button", { name: "2030-02-01 · Available" }).disabled,
      false,
    ),
  );
  assert.ok(
    screen.getByRole("button", { name: "2030-02-02 · Unavailable" }).disabled,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "2030-02-01 · Available" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "2030-02-03 · Available" }),
  );
  await screen.findByText(/This range includes an unavailable/);
  assert.equal(
    screen.getByTestId("dates").textContent,
    "2030-02-01/2030-02-01",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "2030-02-01 · Available" }),
  );
  await screen.findByText(/Dates selected/);
});

test("refresh failure clears availability labels and retry restores checked dates", async () => {
  const demo = setup();
  render(
    <ApiProvider runtime={runtime(demo)}>
      <CalendarHarness />
    </ApiProvider>,
  );
  await screen.findByRole("button", { name: "2030-02-01 · Available" });
  demo.failNext();
  fireEvent.click(screen.getByRole("button", { name: "Refresh availability" }));
  await screen.findByRole("alert");
  assert.ok(
    screen.getByRole("button", { name: "2030-02-01 · Not checked" }).disabled,
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    assert.equal(
      screen.getByRole("button", { name: "2030-02-01 · Available" }).disabled,
      false,
    ),
  );
});

test("contact and delivery notes reject unsafe destinations and unbounded/empty requests", () => {
  assert.equal(
    contactHref("zalo", "https://zalo.me/12345678"),
    "https://zalo.me/12345678",
  );
  for (const url of [
    "javascript:alert(1)",
    "https://zalo.me.evil.example/",
    "https://user:pass@zalo.me/",
    "http://zalo.me/123",
  ])
    assert.equal(contactHref("zalo", url), null);
  assert.equal(contactHref("phone", "+84912345678"), "tel:+84912345678");
  assert.equal(contactHref("phone", "123;alert(1)"), null);
  assert.throws(() => requestNotes("", "S", "shipping", ""));
  assert.throws(() => requestNotes("x".repeat(1001), "", "pickup", ""));
  assert.match(
    requestNotes("Careful", "Size: S", "shipping", "12 Street"),
    /shop xác nhận phí\/khu vực/,
  );
});

test("shipping and advisory size remain notes; submission stays pending with no variants or payment prompt", async () => {
  const demo = setup();
  demo.signIn("customer");
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(demo)}>
      <RentalRequest slugs={["muse-dress"]} advice="Size advice: S" />
    </ApiProvider>,
  );
  fireEvent.change(screen.getByLabelText("Pickup date"), {
    target: { value: "2030-02-01" },
  });
  fireEvent.change(screen.getByLabelText("Return date"), {
    target: { value: "2030-02-01" },
  });
  await user.click(screen.getByRole("button", { name: "Check availability" }));
  await screen.findByRole("heading", { name: "Sample quote" });
  // Delivery is an advisory request, using the same order API.
  fireEvent.click(screen.getByLabelText("Request delivery for store review"));
  assert.ok(screen.getByRole("button", { name: "Send demo request" }).disabled);
  fireEvent.change(screen.getByLabelText(/^Delivery address/), {
    target: { value: "12 Street" },
  });
  await user.click(screen.getByRole("button", { name: "Send demo request" }));
  await screen.findByText("We've received your request.");
  const [order] = await demo.api.call("orders.list", undefined);
  assert.equal(order.status, "pending");
  assert.match(order.notes, /Size advice: S/);
  assert.match(order.notes, /12 Street/);
  assert.equal(order.lines[0].variantId, undefined);
  assert.equal(screen.queryByAltText("Store bank transfer QR"), null);
  cleanup();
  render(<BookingConfirmation order={order} />);
  assert.equal(screen.queryByText(/Transfer reference:/), null);
  assert.equal(screen.queryByText(/bank transfer|deposit|payment/i), null);
});
