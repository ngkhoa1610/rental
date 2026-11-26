import "./dom-setup.mjs";
import React from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import {
  AdminOrders,
  ordersInQueue,
} from "../src/components/admin/admin-orders.tsx";
import { AdminOverview } from "../src/components/admin/admin-overview.tsx";

afterEach(cleanup);

test("dashboard queue links preselect orders and staff can transition a pending order", async () => {
  const pending = {
    id: "sample-order-1",
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
    notes: "Sample order for administration practice.",
    status: "pending",
    version: 1,
    createdAt: "2030-01-01T12:00:00.000Z",
    changes: [],
    history: [],
  };
  const confirmed = {
    ...pending,
    status: "confirmed",
    version: 2,
    history: [
      { action: "Confirmed", note: "Đã kiểm tra tồn", at: pending.createdAt },
    ],
  };
  let submitted;
  const runtime = {
    setCsrf() {},
    api: {
      async call(operation, input) {
        if (operation === "session.get")
          return {
            profile: {
              id: "staff-1",
              name: "Staff",
              phone: "",
              permissions: ["orders:manage"],
            },
            csrfToken: "csrf",
          };
        if (operation === "admin.orders.list")
          return [submitted ? confirmed : pending];
        assert.equal(operation, "admin.orders.transition");
        submitted = input;
        return confirmed;
      },
    },
  };
  const user = userEvent.setup();
  const dashboard = render(
    <ApiProvider runtime={runtime} scope="admin">
      <AdminOverview />
    </ApiProvider>,
  );
  const queue = await screen.findByRole("link", { name: "Chờ duyệt 1" });
  assert.equal(queue.getAttribute("href"), "/admin/orders?queue=pending");
  const pendingSection = screen.getByRole("region", { name: "Chờ duyệt" });
  const detail = within(pendingSection).getByRole("link", {
    name: /sample-order-1/,
  });
  assert.equal(
    detail.getAttribute("href"),
    "/admin/orders?queue=pending&order=sample-order-1",
  );
  dashboard.unmount();

  render(
    <ApiProvider runtime={runtime} scope="admin">
      <AdminOrders queue="pending" />
    </ApiProvider>,
  );
  await user.click(
    await screen.findByRole("button", { name: "Mở đơn sample-order-1" }),
  );
  await screen.findByRole("heading", { name: "Đơn sample-order-1" });
  assert.ok(screen.getByText("Sample order for administration practice."));
  assert.ok(screen.getByRole("heading", { name: "Lịch sử xử lý" }));
  const form = screen.getByRole("form", { name: "Cập nhật trạng thái đơn" });
  const picker = within(form).getByLabelText("Trạng thái tiếp theo");
  assert.ok(
    !Array.from(picker.options).some(({ value }) => value === "completed"),
  );
  await user.selectOptions(picker, "confirmed");
  await user.type(
    within(form).getByLabelText("Ghi chú nhân viên"),
    "Đã kiểm tra tồn",
  );
  await user.click(
    within(form).getByRole("button", { name: "Lưu trạng thái" }),
  );
  await screen.findByText("Đã kiểm tra tồn");
  assert.equal(submitted.status, "confirmed");
  assert.equal(submitted.version, 1);
  await user.click(screen.getByRole("button", { name: "Về danh sách đơn" }));
  assert.equal(
    screen.queryByRole("button", { name: "Mở đơn sample-order-1" }),
    null,
  );
});

test("daily work queues distinguish planned same-day returns and overdue rentals", () => {
  const today = "2030-02-02";
  const sameDay = { pickupDate: today, returnDate: today, status: "confirmed" };
  const dueBack = {
    pickupDate: "2030-02-01",
    returnDate: today,
    status: "renting",
  };
  const overdue = {
    pickupDate: "2030-01-31",
    returnDate: "2030-02-01",
    status: "renting",
  };
  const pending = { ...sameDay, status: "pending" };
  const orders = [sameDay, dueBack, overdue, pending];
  assert.deepEqual(ordersInQueue(orders, "pickup", today), [sameDay]);
  assert.deepEqual(ordersInQueue(orders, "return", today), [sameDay, dueBack]);
  assert.deepEqual(ordersInQueue(orders, "overdue", today), [overdue]);
  assert.deepEqual(ordersInQueue(orders, "pending", today), [pending]);
});
