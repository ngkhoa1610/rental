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
afterEach(cleanup);

const customer = {
  id: "customer-1",
  name: "Customer",
  phone: "0900000000",
  permissions: [],
};
const owner = {
  id: "owner-1",
  name: "Owner",
  phone: "",
  permissions: [
    "orders:manage",
    "catalog:manage",
    "customers:read",
    "reviews:moderate",
    "staff:manage",
  ],
};
const pending = {
  id: "sample-order-1",
  customerId: customer.id,
  contact: { name: customer.name, phone: customer.phone },
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
  history: [
    {
      at: "2030-01-01T12:00:00.000Z",
      actorId: owner.id,
      action: "Submitted",
      note: "",
    },
  ],
};
const product = {
  slug: "muse-dress",
  name: "Muse Dress",
  description: "Pink dress",
  category: "Dresses",
  collection: "Test collection",
  occasions: [],
  visibility: "published",
  price: 280000,
  rentalDays: 3,
  quantity: 2,
  image: "/images/sakura-muse-dress.png",
  imageAlt: "Pink dress",
  additionalPhotos: [],
  version: 1,
};

function runtime(profile, handlers) {
  return {
    setCsrf() {},
    api: {
      async call(operation, input) {
        if (operation === "session.get") return { profile, csrfToken: "csrf" };
        assert.ok(handlers[operation], `Unexpected operation ${operation}`);
        return handlers[operation](input);
      },
    },
  };
}

test("admin searches customer records and opens order history on demand", async () => {
  const service = runtime(owner, {
    "admin.customers.list": () => [customer],
    "admin.orders.list": () => [pending],
  });
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={service} scope="admin">
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
    (await screen.findByRole("link", { name: "sample-order-1" })).getAttribute(
      "href",
    ),
    "/admin/orders?order=sample-order-1",
  );
});

test("admin filters reviews and updates staff through existing protected actions", async () => {
  const member = {
    id: "staff-1",
    name: "Staff member",
    phone: "",
    permissions: ["orders:manage"],
    active: true,
    version: 1,
  };
  const review = {
    id: "review-1",
    orderId: "order-1",
    rating: 5,
    story: "Test review",
    consentToPublish: true,
    mediaIds: [],
    moderation: "pending",
    moderationNote: "",
    version: 1,
  };
  let moderation, staffUpdate;
  const service = runtime(owner, {
    "admin.reviews.list": () => [
      moderation ? { ...review, moderation: "approved" } : review,
      {
        ...review,
        id: "review-2",
        orderId: "order-2",
        consentToPublish: false,
      },
    ],
    "admin.staff.list": () => [
      { ...owner, active: true, version: 1 },
      staffUpdate ? { ...member, active: false } : member,
    ],
    "admin.reviews.moderate": (input) => {
      moderation = input;
    },
    "admin.staff.update": (input) => {
      staffUpdate = input;
    },
  });
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={service} scope="admin">
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
  await screen.findByText("Đã lưu quyết định.");
  await user.selectOptions(
    await screen.findByLabelText("Trạng thái duyệt"),
    "approved",
  );
  await screen.findByText(/^Khách đồng ý công khai.*Đã duyệt$/);
  const ownerSection = screen
    .getByText("Tài khoản quản trị được bảo vệ.")
    .closest("section");
  assert.equal(
    within(ownerSection).queryByRole("button", { name: "Lưu quyền" }),
    null,
  );
  const staff = screen
    .getByRole("heading", { name: "Staff member" })
    .closest("section");
  await user.click(within(staff).getByLabelText("Tài khoản hoạt động"));
  await user.click(within(staff).getByRole("button", { name: "Lưu quyền" }));
  await screen.findByText("Đã lưu quyền.");
  await user.selectOptions(
    await screen.findByLabelText("Trạng thái nhân sự"),
    "inactive",
  );
  assert.ok(await screen.findByRole("heading", { name: "Staff member" }));
  assert.equal(screen.queryByRole("heading", { name: "Owner" }), null);
  assert.equal(moderation.decision, "approved");
  assert.equal(staffUpdate.active, false);
});

test("customer orders show every status without privileged controls or actor identifiers", async () => {
  const service = runtime(customer, {
    "orders.list": () =>
      [
        "pending",
        "confirmed",
        "renting",
        "completed",
        "cancelled",
        "rejected",
        "returned",
      ].map((status, index) => ({
        ...pending,
        status,
        id: "sample-order-" + (index + 1),
      })),
  });
  render(
    <ApiProvider runtime={service}>
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
  assert.equal(document.querySelector('a[href^="/admin"]'), null);
  assert.equal(document.body.textContent.includes(owner.id), false);
});

test("failed admin save retains input, retries once and shows success; markup remains escaped", async () => {
  let attempts = 0;
  let saved;
  const service = runtime(owner, {
    "admin.products.list": () => [saved ?? product],
    "admin.products.save": ({ product: value }) => {
      if (++attempts === 1) throw new Error("Could not save");
      saved = { ...value, version: 2 };
      return saved;
    },
  });
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={service} scope="admin">
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
  await user.click(within(panel).getByRole("button", { name: "Lưu sản phẩm" }));
  await within(panel).findByRole("alert");
  assert.equal(name.value, "<script>new name</script>");
  await user.dblClick(
    within(panel).getByRole("button", { name: "Lưu sản phẩm" }),
  );
  await screen.findByText("Đã lưu sản phẩm.");
  await screen.findByText("<script>new name</script>");
  assert.equal(document.querySelector("script"), null);
  assert.equal(attempts, 2);
  assert.equal(saved.version, 2);
});

test("album saves a promoted cover and custom alt without retaining a removed photo", async () => {
  const first = { url: "/images/sakura-luna-set.png", alt: "First alternate" };
  const second = {
    url: "/images/sakura-soleil-top.png",
    alt: "Second alternate",
  };
  let submitted;
  const service = runtime(owner, {
    "admin.products.list": () => [
      { ...product, additionalPhotos: [first, second] },
    ],
    "admin.products.save": (input) => {
      submitted = input.product;
    },
  });
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={service} scope="admin">
      <AdminProducts />
    </ApiProvider>,
  );
  const row = await screen.findByRole("row", { name: /muse-dress/ });
  await user.click(within(row).getByRole("button", { name: /^Chỉnh sửa / }));
  await user.click(screen.getAllByRole("button", { name: "Lên" })[1]);
  await user.click(
    screen.getAllByRole("button", { name: "Đặt làm đại diện" })[0],
  );
  await user.click(screen.getAllByRole("button", { name: "Gỡ ảnh" })[1]);
  fireEvent.change(screen.getByLabelText("Mô tả ảnh phụ 1"), {
    target: { value: "Góc trước" },
  });
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }));
  await screen.findByText("Đã lưu sản phẩm.");
  assert.equal(submitted.image, second.url);
  assert.equal(submitted.imageAlt, second.alt);
  assert.deepEqual(submitted.additionalPhotos, [
    { url: product.image, alt: "Góc trước" },
  ]);
});
