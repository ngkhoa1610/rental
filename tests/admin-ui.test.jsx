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
import { AdminCustomers } from "../src/components/admin/admin-customers.tsx";
import { AdminReviews } from "../src/components/admin/admin-reviews.tsx";
import { AdminTeam } from "../src/components/admin/admin-team.tsx";
import { createMockApi } from "../src/lib/api/mock.ts";
afterEach(cleanup);

test("admin searches customer records and opens order history on demand", async () => {
  const admin = createMockApi({ latencyMs: 0 }).forScope("admin");
  admin.signIn("admin");
  admin.seedDemoData();
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(admin)}>
      <AdminCustomers />
    </ApiProvider>,
  );
  const lookup = await screen.findByLabelText(
    "Tìm theo tên hoặc số điện thoại",
  );
  assert.equal(screen.queryByRole("link", { name: "sample-order-1" }), null);
  await user.type(lookup, "khong-co-khach");
  await screen.findByText("Không tìm thấy khách hàng.");
  await user.clear(lookup);
  await user.type(lookup, "0900-000-000");
  await user.click(screen.getByRole("button", { name: "Lịch sử thuê" }));
  assert.equal(
    (await screen.findByRole("link", { name: "sample-order-1" })).getAttribute("href"),
    "/admin/orders?order=sample-order-1",
  );
});

test("admin filters reviews and updates staff through existing protected actions", async () => {
  const admin = createMockApi({ latencyMs: 0 }).forScope("admin");
  admin.signIn("admin");
  admin.seedDemoData();
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(admin)}>
      <AdminReviews />
      <AdminTeam />
    </ApiProvider>,
  );
  const reviewStatus = await screen.findByLabelText("Trạng thái duyệt");
  await user.selectOptions(reviewStatus, "approved");
  await screen.findByText("Không có feedback phù hợp.");
  await user.selectOptions(reviewStatus, "pending");
  const consent = screen
    .getByText(/^Khách đồng ý công khai/)
    .closest("section");
  const noConsent = screen
    .getByText(/^Khách chưa đồng ý công khai/)
    .closest("section");
  assert.equal(
    within(noConsent).getByRole("option", { name: "Duyệt" }).disabled,
    true,
  );
  await user.selectOptions(
    within(consent).getByLabelText("Quyết định"),
    "approved",
  );
  await user.type(
    within(consent).getByLabelText("Lý do"),
    "Đã kiểm tra nội dung",
  );
  await user.click(
    within(consent).getByRole("button", { name: "Lưu quyết định" }),
  );
  await screen.findByText("Đã lưu quyết định mẫu trong tab này.");
  await user.selectOptions(
    await screen.findByLabelText("Trạng thái duyệt"),
    "approved",
  );
  await screen.findByText(/^Khách đồng ý công khai.*Đã duyệt$/);
  const owner = screen
    .getByText("Tài khoản quản trị được bảo vệ.")
    .closest("section");
  assert.equal(
    within(owner).queryByRole("button", { name: "Lưu quyền" }),
    null,
  );
  const staff = screen
    .getByRole("heading", { name: "Demo staff" })
    .closest("section");
  await user.click(within(staff).getByLabelText("Tài khoản hoạt động"));
  await user.click(within(staff).getByRole("button", { name: "Lưu quyền" }));
  await screen.findByText("Đã lưu quyền mẫu trong tab này.");
  await user.selectOptions(
    await screen.findByLabelText("Trạng thái nhân sự"),
    "inactive",
  );
  assert.ok(await screen.findByRole("heading", { name: "Demo staff" }));
  assert.equal(screen.queryByRole("heading", { name: "Demo admin" }), null);
});
const runtime = (demo) => ({ demo, api: demo.api, setCsrf() {} });
test("customer orders show every status without privileged controls or actor identifiers", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  admin.seedDemoData();
  const customer = backend.forScope("customer");
  customer.signIn("customer");
  render(
    <ApiProvider runtime={runtime(customer)}>
      <RentalOrders />
    </ApiProvider>,
  );
  await screen.findByRole("article", { name: /\bsample-order-1$/ });
  await screen.findByRole("article", { name: /\bsample-order-4$/ });
  assert.equal(screen.queryByText("Record offline payment"), null);
  assert.equal(
    screen.queryByText("Request a date change or cancellation"),
    null,
  );
  assert.equal(screen.queryByText("Update rental status"), null);
  assert.equal(screen.queryByText(/demo-admin/), null);
  assert.equal(document.querySelector('a[href^="/admin"]'), null);
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
  const museRow = await screen.findByRole("row", { name: /muse-dress/ });
  await user.click(
    within(museRow).getByRole("button", { name: /^Chỉnh sửa / }),
  );
  const panel = screen
    .getByRole("heading", { name: /^Chỉnh sửa / })
    .closest("section");
  const name = within(panel).getByLabelText("Tên sản phẩm");
  fireEvent.change(name, { target: { value: "<script>new name</script>" } });
  admin.failNext();
  await user.click(within(panel).getByRole("button", { name: "Lưu sản phẩm" }));
  await within(panel).findByRole("alert");
  assert.equal(name.value, "<script>new name</script>");
  await user.dblClick(
    within(panel).getByRole("button", { name: "Lưu sản phẩm" }),
  );
  await screen.findByText("Đã lưu sản phẩm mẫu trong tab này.");
  await screen.findByText("<script>new name</script>");
  assert.equal(document.querySelector("script"), null);
  assert.equal(
    (await admin.api.call("admin.products.list", undefined)).find(
      (p) => p.slug === "muse-dress",
    ).version,
    2,
  );
});

test("admin can create a draft with a cover, price block and merchandising fields", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(admin)}>
      <AdminProducts />
    </ApiProvider>,
  );
  await user.click(
    await screen.findByRole("button", { name: "Thêm sản phẩm" }),
  );
  const editor = screen.getByRole("region", { name: "Thêm sản phẩm" });
  const fields = within(editor);
  const product = {
    slug: "dam-thu-nghiem",
    name: "Đầm thử nghiệm",
    description: "Đầm mẫu để thử form.",
    collection: "Bộ sưu tập thử",
    price: 275_000,
    rentalDays: 2,
    quantity: 4,
  };
  const labels = {
    slug: /^Slug sản phẩm/,
    name: "Tên sản phẩm",
    description: "Mô tả sản phẩm",
    collection: "Bộ sưu tập",
    price: "Giá mỗi block (VND)",
    rentalDays: "Số ngày mỗi block",
    quantity: "Tổng số lượng",
  };
  for (const [key, label] of Object.entries(labels))
    fireEvent.change(fields.getByLabelText(label), {
      target: { value: product[key] },
    });

  await user.selectOptions(fields.getByLabelText("Danh mục"), "Outerwear");
  const occasion = fields.getAllByRole("checkbox")[0];
  await user.click(occasion);
  const photo = fields.getByLabelText("Chọn ảnh mẫu");
  const image = Array.from(photo.options).find((option) => option.value).value;
  await user.selectOptions(photo, image);
  const imageAlt = "Ảnh đại diện đầm thử";
  fireEvent.change(fields.getByLabelText("Mô tả ảnh"), {
    target: { value: imageAlt },
  });
  await fields.findByRole("img", { name: imageAlt });
  await user.click(fields.getByRole("button", { name: "Lưu sản phẩm" }));
  await screen.findByText("Đã lưu sản phẩm mẫu trong tab này.");
  await screen.findByRole("row", { name: /dam-thu-nghiem/ });
  const actual = (await admin.api.call("admin.products.list", undefined)).find(
    ({ slug }) => slug === product.slug,
  );
  assert.deepEqual(actual, {
    ...product,
    category: "Outerwear",
    occasions: [occasion.value],
    image,
    imageAlt,
    additionalPhotos: [],
    visibility: "draft",
    version: 1,
  });
});

test("album retains cover, additional photo order and alt after promotion and removal", async () => {
  const backend = createMockApi({ latencyMs: 0 });
  const admin = backend.forScope("admin");
  admin.signIn("admin");
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime(admin)}>
      <AdminProducts />
    </ApiProvider>,
  );
  await user.click(
    within(await screen.findByRole("row", { name: /muse-dress/ })).getByRole(
      "button",
      { name: /^Chỉnh sửa / },
    ),
  );
  const originalCover = screen.getByLabelText("Chọn ảnh mẫu").value;
  const picker = screen.getByLabelText("Thêm ảnh mẫu vào album");
  const [first, second] = Array.from(picker.options)
    .map((option) => option.value)
    .filter(Boolean);
  await user.selectOptions(picker, first);
  await user.selectOptions(picker, second);
  await user.click(screen.getAllByRole("button", { name: "Lên" })[1]);
  await user.click(
    screen.getAllByRole("button", { name: "Đặt làm đại diện" })[0],
  );
  await user.click(screen.getAllByRole("button", { name: "Gỡ ảnh" })[1]);
  fireEvent.change(screen.getByLabelText("Mô tả ảnh phụ 1"), {
    target: { value: "Góc trước" },
  });
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }));
  await screen.findByText("Đã lưu sản phẩm mẫu trong tab này.");
  const saved = (await admin.api.call("admin.products.list", undefined)).find(
    ({ slug }) => slug === "muse-dress",
  );
  assert.equal(saved.image, second);
  assert.deepEqual(saved.additionalPhotos, [
    { url: originalCover, alt: "Góc trước" },
  ]);
  const { additionalPhotos, ...legacyProduct } = saved;
  const legacySave = await admin.api.call("admin.products.save", {
    product: legacyProduct,
    idempotencyKey: crypto.randomUUID(),
  });
  assert.deepEqual(legacySave.additionalPhotos, additionalPhotos);
  const publicProduct = await backend
    .forScope("customer")
    .api.call("catalog.get", { slug: saved.slug });
  assert.equal(publicProduct.image, second);
  assert.equal(Object.hasOwn(publicProduct, "additionalPhotos"), false);
});
