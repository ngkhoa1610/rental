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
import {
  LanguageProvider,
  LanguageSwitch,
} from "../src/components/store/language-provider.tsx";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { SelectionProvider } from "../src/components/store/selection-provider.tsx";
import { RentalRequest } from "../src/components/store/rental-request.tsx";
import { Catalog } from "../src/components/store/catalog.tsx";
import { createMockApi } from "../src/lib/api/mock.ts";
import { languageStorageKey, translate } from "../src/lib/language.ts";
import { rentalToday } from "../src/lib/rental-dates.ts";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("VI is default; switching to EN keeps dates, notes and session without navigation and persists the choice", async () => {
  const demo = createMockApi({ latencyMs: 0 });
  const user = userEvent.setup();
  const before = window.location.href;
  render(
    <LanguageProvider>
      <LanguageSwitch />
      <ApiProvider runtime={{ demo, api: demo.api, setCsrf() {} }}>
        <RentalRequest slugs={["muse-dress"]} />
      </ApiProvider>
    </LanguageProvider>,
  );
  const pickup = screen.getByLabelText("Ngày nhận");
  const returned = screen.getByLabelText("Ngày trả");
  assert.equal(pickup.min, rentalToday());
  fireEvent.change(pickup, { target: { value: "2030-02-01" } });
  assert.equal(returned.value, "2030-02-01");
  assert.equal(returned.min, "2030-02-01");
  fireEvent.change(returned, { target: { value: "2030-02-02" } });
  fireEvent.change(screen.getByLabelText(/Lời nhắn/), {
    target: { value: "Giữ nguyên nội dung của tôi" },
  });
  await user.click(
    await screen.findByRole("button", { name: "Dùng tài khoản mẫu" }),
  );
  await user.click(screen.getByRole("button", { name: "English" }));
  assert.equal(document.documentElement.lang, "en");
  assert.equal(screen.getByLabelText("Return date").value, "2030-02-02");
  assert.equal(
    screen.getByLabelText(/Notes for the store/).value,
    "Giữ nguyên nội dung của tôi",
  );
  assert.ok(screen.getByRole("button", { name: "Sign out" }));
  assert.equal(localStorage.getItem(languageStorageKey), "en");
  assert.equal(window.location.href, before);
  fireEvent.change(screen.getByLabelText("Pickup date"), {
    target: { value: "2030-02-05" },
  });
  assert.equal(screen.getByLabelText("Return date").value, "2030-02-05");
  cleanup();
  render(
    <LanguageProvider>
      <LanguageSwitch />
    </LanguageProvider>,
  );
  await waitFor(() =>
    assert.equal(
      screen
        .getByRole("button", { name: "English" })
        .getAttribute("aria-pressed"),
      "true",
    ),
  );
});

test("translated filters keep canonical values and Vietnamese search supports missing accents", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <LanguageSwitch />
      <SelectionProvider>
        <Catalog />
      </SelectionProvider>
    </LanguageProvider>,
  );
  await user.click(screen.getByText("Bộ lọc & sắp xếp"));
  const category = screen.getByLabelText("Danh mục");
  await user.selectOptions(category, "Sets");
  await user.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));
  assert.ok(screen.getByRole("heading", { name: "Luna Set" }));
  assert.equal(screen.queryByRole("heading", { name: "Muse Dress" }), null);
  await user.click(screen.getByRole("button", { name: "English" }));
  assert.equal(screen.getByLabelText("Category").value, "Sets");
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  fireEvent.change(screen.getByLabelText("Search looks"), {
    target: { value: "hen ho muse" },
  });
  await user.click(screen.getByRole("button", { name: "Apply filters" }));
  assert.ok(screen.getByRole("heading", { name: "Muse Dress" }));
  assert.equal(screen.queryByRole("heading", { name: "Luna Set" }), null);
});

test("translation preserves spacing and values; unsupported device preferences are ignored", async () => {
  assert.equal(translate("vi", " Total: "), " Tổng cộng: ");
  assert.equal(
    translate("vi", "Order {id}", { id: "<script>name</script>" }),
    "Đơn thuê <script>name</script>",
  );
  assert.equal(
    translate("vi", "Unknown backend message"),
    "Unknown backend message",
  );
  localStorage.setItem(languageStorageKey, "<script>");
  render(
    <LanguageProvider>
      <LanguageSwitch />
    </LanguageProvider>,
  );
  await waitFor(() => assert.equal(document.documentElement.lang, "vi"));
  assert.equal(
    screen
      .getByRole("button", { name: "Tiếng Việt" })
      .getAttribute("aria-pressed"),
    "true",
  );
});
