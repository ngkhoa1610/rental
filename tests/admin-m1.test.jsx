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
import { AdminAvailability } from "../src/components/admin/admin-availability.tsx";
import {
  AdminOrders,
  ordersInQueue,
} from "../src/components/admin/admin-orders.tsx";
import { AdminOverview } from "../src/components/admin/admin-overview.tsx";
import { createMockApi } from "../src/lib/api/mock.ts";

afterEach(cleanup);

const runtime = (demo) => ({ demo, api: demo.api, setCsrf() {} });
const idempotencyKey = () => crypto.randomUUID();

test("dashboard queue links preselect orders and staff can transition a pending order", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  admin.seedDemoData();
  const user = userEvent.setup();
  const dashboard = render(
    <ApiProvider runtime={runtime(admin)}>
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
    <ApiProvider runtime={runtime(admin)}>
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
  const order = (await admin.api.call("admin.orders.list", undefined)).find(
    ({ id }) => id === "sample-order-1",
  );
  assert.equal(order.status, "confirmed");
  assert.equal(order.version, 2);
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

test("admin stock requires inventory permission and shows inclusive reservations and blocks", async () => {
  const backend = createMockApi({
    now: () => Date.parse("2030-02-01T10:00:00Z"),
    latencyMs: 0,
  });
  const admin = backend.forScope("admin");
  const staff = backend.forScope("admin");
  const customer = backend.forScope("customer");
  admin.signIn("admin");
  staff.signIn("staff");
  customer.signIn("customer");
  const input = { month: "2030-02", productSlug: "muse-dress" };
  const draft = await admin.api.call("admin.products.list", undefined);
  const product = draft.find(({ slug }) => slug === input.productSlug);
  const member = (await admin.api.call("admin.staff.list", undefined)).find(
    ({ id }) => id === "demo-staff",
  );
  const granted = await admin.api.call("admin.staff.update", {
    id: member.id,
    version: member.version,
    active: true,
    permissions: ["availability:manage"],
    idempotencyKey: idempotencyKey(),
  });
  assert.equal(
    (await staff.api.call("admin.availability.stock", input)).productSlug,
    input.productSlug,
  );
  await assert.rejects(staff.api.call("admin.products.list", undefined), {
    code: "FORBIDDEN",
  });
  await admin.api.call("admin.staff.update", {
    id: member.id,
    version: granted.version,
    active: true,
    permissions: ["orders:manage"],
    idempotencyKey: idempotencyKey(),
  });
  await assert.rejects(staff.api.call("admin.availability.stock", input), {
    code: "FORBIDDEN",
  });
  await assert.rejects(customer.api.call("admin.availability.stock", input), {
    code: "FORBIDDEN",
  });
  await assert.rejects(
    admin.api.call("admin.availability.stock", { ...input, month: "2030-13" }),
    { code: "VALIDATION" },
  );
  const dates = { pickupDate: "2030-02-01", returnDate: "2030-02-02" };
  const quote = await customer.api.call("availability.quote", {
    ...dates,
    items: [{ productSlug: input.productSlug, quantity: 1 }],
  });
  const request = await customer.api.call("orders.create", {
    quoteId: quote.id,
    notes: "",
    idempotencyKey: idempotencyKey(),
  });
  const readStock = () => admin.api.call("admin.availability.stock", input);
  assert.equal((await readStock()).days[0].reserved, 0);
  await admin.api.call("admin.orders.transition", {
    orderId: request.id,
    status: "confirmed",
    note: "Đã kiểm tra",
    version: request.version,
    idempotencyKey: idempotencyKey(),
  });
  const block = await admin.api.call("admin.availability.save", {
    block: {
      ...dates,
      id: "",
      version: 0,
      productSlug: input.productSlug,
      quantity: 1,
      reason: "Bảo trì",
    },
    idempotencyKey: idempotencyKey(),
  });
  const snapshot = await readStock();
  assert.deepEqual(snapshot.days.slice(0, 3), [
    {
      date: "2030-02-01",
      reserved: 1,
      blocked: 1,
      available: product.quantity - 2,
    },
    {
      date: "2030-02-02",
      reserved: 1,
      blocked: 1,
      available: product.quantity - 2,
    },
    {
      date: "2030-02-03",
      reserved: 0,
      blocked: 0,
      available: product.quantity,
    },
  ]);
  await admin.api.call("admin.availability.remove", {
    id: block.id,
    version: block.version,
    idempotencyKey: idempotencyKey(),
  });
  assert.equal((await readStock()).days[1].blocked, 0);
});

test("stock UI retains the selected product and month through create, edit and remove", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(admin)}>
      <AdminAvailability />
    </ApiProvider>,
  );
  const open = () => screen.findByRole("button", { name: "Tạo khóa lịch" });
  const stock = await screen.findByRole("region", {
    name: "Lịch tồn theo sản phẩm",
  });
  const product = within(stock).getByLabelText("Sản phẩm");
  await screen.findAllByText("Còn trống");
  const selection = Array.from(product.options).find(
    ({ value }) => value !== product.value,
  );
  await user.selectOptions(product, selection.value);
  fireEvent.change(within(stock).getByLabelText("Tháng"), {
    target: { value: "2099-07" },
  });
  await screen.findByText("01/07/2099");
  await user.click(await open());
  let editor = screen.getByRole("region", { name: "Tạo khóa lịch" });
  await user.type(within(editor).getByLabelText("Lý do"), "Bảo trì thử");
  await user.click(
    within(editor).getByRole("button", { name: "Lưu khóa lịch" }),
  );
  await screen.findByText(/Bảo trì thử/);
  assert.equal(screen.getByLabelText("Tháng").value, "2099-07");
  assert.equal(screen.getByLabelText("Sản phẩm").value, selection.value);
  await user.click(screen.getByRole("button", { name: "Sửa khóa" }));
  editor = screen.getByRole("region", { name: "Sửa khóa lịch" });
  const reason = within(editor).getByLabelText("Lý do");
  assert.equal(reason.value, "Bảo trì thử");
  await user.clear(reason);
  await user.type(reason, "Bảo trì đã cập nhật");
  await user.click(
    within(editor).getByRole("button", { name: "Lưu khóa lịch" }),
  );
  await screen.findByText(/Bảo trì đã cập nhật/);
  await user.click(screen.getByRole("button", { name: "Gỡ khóa" }));
  await user.click(screen.getByRole("button", { name: "Xác nhận gỡ" }));
  await screen.findByText(
    "Không có khóa lịch cho sản phẩm này trong tháng đã chọn.",
  );
  assert.equal(screen.getByLabelText("Tháng").value, "2099-07");
  assert.equal(screen.getByLabelText("Sản phẩm").value, selection.value);
});
