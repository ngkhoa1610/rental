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
import {
  monthDates,
  rangeDates,
  shiftMonth,
} from "../src/lib/rental-calendar.ts";
import { contactHref, requestNotes } from "../src/lib/store-details.ts";
import { createHttpApi } from "../src/lib/api/http.ts";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { AvailabilityCalendar } from "../src/components/store/availability-calendar.tsx";
import { translate as t } from "../src/lib/language.ts";

function calendarResponse(month, unavailable = []) {
  return {
    productSlug: "muse-dress",
    month,
    checkedAt: "2030-01-01T10:00:00.000Z",
    days: monthDates(month).map((date) => ({
      date,
      available: unavailable.includes(date) ? 0 : 2,
    })),
  };
}
function calendarRuntime(getCalendar) {
  return {
    setCsrf() {},
    api: {
      async call(operation, input) {
        if (operation === "session.get")
          return { profile: null, csrfToken: null };
        assert.equal(operation, "availability.calendar");
        return getCalendar(input.month);
      },
    },
  };
}
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

test("HTTP calendar is same-origin no-store and rejects incomplete, reordered or negative stock DTOs", async () => {
  const valid = calendarResponse("2030-02");
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
  const runtime = calendarRuntime((month) =>
    calendarResponse(month, ["2030-02-02"]),
  );
  render(
    <ApiProvider runtime={runtime}>
      <CalendarHarness />
    </ApiProvider>,
  );
  await waitFor(() =>
    assert.equal(
      screen.getByRole("button", { name: `2030-02-01 · ${t("Available")}` })
        .disabled,
      false,
    ),
  );
  assert.ok(
    screen.getByRole("button", { name: `2030-02-02 · ${t("Unavailable")}` })
      .disabled,
  );
  fireEvent.click(
    screen.getByRole("button", { name: `2030-02-01 · ${t("Available")}` }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: `2030-02-03 · ${t("Available")}` }),
  );
  await screen.findByText(
    t(
      "This range includes an unavailable or unchecked day. Choose another range.",
    ),
  );
  assert.equal(
    screen.getByTestId("dates").textContent,
    "2030-02-01/2030-02-01",
  );
  fireEvent.click(
    screen.getByRole("button", { name: `2030-02-01 · ${t("Available")}` }),
  );
  await screen.findByText(
    t("Dates selected. Check the full range before sending your request."),
  );
});

test("refresh failure clears availability labels and retry restores checked dates", async () => {
  let fail = false;
  const runtime = calendarRuntime((month) => {
    if (fail) throw new Error("Availability unavailable");
    return calendarResponse(month);
  });
  render(
    <ApiProvider runtime={runtime}>
      <CalendarHarness />
    </ApiProvider>,
  );
  await screen.findByRole("button", { name: `2030-02-01 · ${t("Available")}` });
  fail = true;
  fireEvent.click(
    screen.getByRole("button", { name: t("Refresh availability") }),
  );
  await screen.findByRole("alert");
  assert.ok(
    screen.getByRole("button", { name: `2030-02-01 · ${t("Not checked")}` })
      .disabled,
  );
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: t("Retry") }));
  await waitFor(() =>
    assert.equal(
      screen.getByRole("button", { name: `2030-02-01 · ${t("Available")}` })
        .disabled,
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
