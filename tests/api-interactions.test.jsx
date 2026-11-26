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
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { RentalRequest } from "../src/components/store/rental-request.tsx";
import { translate as t } from "../src/lib/language.ts";

afterEach(cleanup);

const customer = {
  id: "customer-1",
  name: "Test customer",
  phone: "0900000000",
  permissions: [],
};
const line = {
  productSlug: "muse-dress",
  quantity: 1,
  name: "Muse Dress",
  available: 2,
  amount: 280000,
};
const dates = { pickupDate: "2099-02-01", returnDate: "2099-02-03" };
const quote = {
  ...dates,
  id: "quote-1",
  lines: [line],
  total: 280000,
  currency: "VND",
  policyLabel: "Test policy",
  expiresAt: "2099-02-01T10:00:00Z",
};

function harness({ profile, getQuote, submit }) {
  return {
    setCsrf() {},
    api: {
      async call(operation, input) {
        if (operation === "session.get")
          return { profile, csrfToken: profile ? "csrf" : null };
        if (operation === "availability.quote") return getQuote(input);
        assert.equal(operation, "orders.create");
        return submit(input);
      },
    },
  };
}

function form(runtime, slugs = ["muse-dress"]) {
  return (
    <ApiProvider runtime={runtime}>
      <RentalRequest slugs={slugs} advice="Size advice: S" />
    </ApiProvider>
  );
}

function fillDates() {
  fireEvent.change(screen.getByLabelText(t("Pickup date")), {
    target: { value: dates.pickupDate },
  });
  fireEvent.change(screen.getByLabelText(t("Return date")), {
    target: { value: dates.returnDate },
  });
}
const quoteButton = () =>
  screen.getByRole("button", { name: t("Check availability") });
const submitButton = () =>
  screen.getByRole("button", { name: t("Send rental request") });

test("rental request preserves dates on quote failure and invalidates a quote when selection changes", async () => {
  let attempts = 0;
  const runtime = harness({
    profile: null,
    getQuote: () => {
      if (++attempts === 1) throw new Error("Service unavailable");
      return quote;
    },
  });
  const user = userEvent.setup();
  const view = render(form(runtime));
  fillDates();
  await user.click(quoteButton());
  await screen.findByRole("alert");
  assert.equal(screen.getByLabelText(t("Return date")).value, dates.returnDate);
  await user.click(quoteButton());
  await screen.findByRole("heading", { name: t("Rental quote") });
  assert.ok(submitButton().disabled);
  view.rerender(form(runtime, ["luna-set"]));
  assert.equal(
    screen.queryByRole("button", { name: t("Send rental request") }),
    null,
  );
});

test("rental request submits advisory size and delivery as notes, once, and shows the pending receipt", async () => {
  const submissions = [];
  const runtime = harness({
    profile: customer,
    getQuote: (input) => {
      assert.deepEqual(input, {
        ...dates,
        items: [{ productSlug: line.productSlug, quantity: 1 }],
      });
      return quote;
    },
    submit: (input) => {
      submissions.push(input);
      return {
        ...dates,
        id: "order-1",
        customerId: customer.id,
        contact: { name: customer.name, phone: customer.phone },
        createdAt: "2099-01-01T10:00:00Z",
        version: 1,
        changes: [],
        history: [],
        status: "pending",
        lines: [line],
        notes: input.notes,
      };
    },
  });
  const user = userEvent.setup();
  const originalUrl = window.location.href;
  render(form(runtime));
  fillDates();
  fireEvent.change(
    screen.getByLabelText(new RegExp(t("Notes for the store").trim())),
    {
      target: { value: "<script>keep this</script>" },
    },
  );
  await user.click(quoteButton());
  await screen.findByRole("heading", { name: t("Rental quote") });
  fireEvent.click(
    screen.getByLabelText(t("Request delivery for store review")),
  );
  assert.ok(submitButton().disabled);
  fireEvent.change(
    screen.getByRole("textbox", { name: new RegExp(t("Delivery address")) }),
    {
      target: { value: "12 Street" },
    },
  );
  await user.dblClick(submitButton());
  await screen.findByText(t("We've received your request."));
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].quoteId, quote.id);
  assert.ok(submissions[0].idempotencyKey);
  assert.match(submissions[0].notes, /Size advice: S/);
  assert.match(submissions[0].notes, /12 Street/);
  assert.match(submissions[0].notes, /<script>keep this<\/script>/);
  assert.equal(document.querySelector("script"), null);
  assert.equal(window.location.href, originalUrl);
  assert.equal(screen.queryByAltText("Store bank transfer QR"), null);
  await waitFor(() =>
    assert.equal(document.activeElement.getAttribute("role"), "status"),
  );
});
