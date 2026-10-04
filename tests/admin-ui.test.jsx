import "./dom-setup.mjs";
import React from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { RentalOrders } from "../src/components/store/rental-orders.tsx";
import { AdminProducts } from "../src/components/admin/admin-products.tsx";
import { createMockApi } from "../src/lib/api/mock.ts";
afterEach(cleanup);
const runtime = (demo) => ({ demo, api: demo.api, setCsrf() {} });
test("customer active/history views exclude other group and privileged controls and actor identifiers", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  admin.seedDemoData();
  const customer = backend.forScope("customer");
  customer.signIn("customer");
  const view = render(
    <ApiProvider runtime={runtime(customer)}>
      <RentalOrders />
    </ApiProvider>,
  );
  await screen.findByRole("article", { name: "Order sample-order-1" });
  assert.equal(
    screen.queryByRole("article", { name: "Order sample-order-4" }),
    null,
  );
  assert.equal(screen.queryByText("Record offline payment"), null);
  assert.equal(screen.queryByText("Update rental status"), null);
  assert.equal(screen.queryByText(/demo-admin/), null);
  assert.equal(document.querySelector('a[href^="/admin"]'), null);
  view.rerender(
    <ApiProvider runtime={runtime(customer)}>
      <RentalOrders history />
    </ApiProvider>,
  );
  await screen.findByRole("article", { name: "Order sample-order-4" });
  assert.equal(
    screen.queryByRole("article", { name: "Order sample-order-1" }),
    null,
  );
  assert.equal(document.body.textContent.includes("demo-admin"), false);
});
test("failed admin save retains input, retries once and shows success; markup remains escaped", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(admin)}>
      <AdminProducts />
    </ApiProvider>,
  );
  const heading = await screen.findByRole("heading", {
    name: "Muse Dress",
    exact: true,
  });
  const panel = heading.closest("section");
  await user.click(within(panel).getByText("Edit product"));
  const name = within(panel).getByLabelText("Name");
  fireEvent.change(name, { target: { value: "<script>new name</script>" } });
  admin.failNext();
  await user.click(within(panel).getByRole("button", { name: "Save product" }));
  await within(panel).findByRole("alert");
  assert.equal(name.value, "<script>new name</script>");
  await user.dblClick(
    within(panel).getByRole("button", { name: "Save product" }),
  );
  await screen.findByText("Changes saved in this tab.");
  await screen.findByRole("heading", { name: "<script>new name</script>" });
  assert.equal(document.querySelector("script"), null);
  assert.equal(
    (await admin.api.call("admin.products.list", undefined)).find(
      (p) => p.slug === "muse-dress",
    ).version,
    2,
  );
});
