import "./dom-setup.mjs";
import React from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LanguageProvider,
  T,
} from "../src/components/store/language-provider.tsx";
import { SelectionProvider } from "../src/components/store/selection-provider.tsx";
import { Catalog } from "../src/components/store/catalog.tsx";
import { translate } from "../src/lib/language.ts";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("Vietnamese is the only visible language and ignores a saved English preference", () => {
  localStorage.setItem("rental-store.language.v1", "en");
  render(
    <LanguageProvider>
      <T>{"The right look."}</T>
    </LanguageProvider>,
  );
  assert.equal(screen.getByText("Đúng outfit.").textContent, "Đúng outfit.");
  assert.equal(screen.queryByRole("button", { name: "English" }), null);
  assert.equal(screen.queryByRole("button", { name: "Tiếng Việt" }), null);
  assert.equal(localStorage.getItem("rental-store.language.v1"), "en");
});

test("catalog filters stay local and Vietnamese search supports missing accents", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
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
  await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
  fireEvent.change(
    screen.getByPlaceholderText("Thử Muse hoặc trang phục dự tiệc"),
    {
      target: { value: "hen ho muse" },
    },
  );
  await user.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));
  assert.ok(screen.getByRole("heading", { name: "Muse Dress" }));
  assert.equal(screen.queryByRole("heading", { name: "Luna Set" }), null);
});

test("Vietnamese translation preserves spacing and interpolated values", () => {
  assert.equal(translate(" Total: "), " Tổng cộng: ");
  assert.equal(
    translate("Order {id}", { id: "<script>name</script>" }),
    "Đơn thuê <script>name</script>",
  );
  assert.equal(translate("Unknown backend message"), "Unknown backend message");
});

test("catalog pagination changes local results and returns to page one after filtering", async () => {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <SelectionProvider>
        <Catalog />
      </SelectionProvider>
    </LanguageProvider>,
  );
  assert.equal(screen.getAllByRole("heading", { level: 2 }).length, 6);
  assert.equal(screen.getByText("Trang 1 / 2").textContent, "Trang 1 / 2");
  await user.click(screen.getByRole("button", { name: "Sau" }));
  assert.equal(screen.getAllByRole("heading", { level: 2 }).length, 6);
  assert.equal(screen.getByText("Trang 2 / 2").textContent, "Trang 2 / 2");
  await user.click(screen.getByText("Bộ lọc & sắp xếp"));
  await user.selectOptions(screen.getByLabelText("Dịp mặc"), "Weekend");
  await user.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));
  assert.equal(screen.getByText("Trang 1 / 2").textContent, "Trang 1 / 2");
  assert.equal(screen.getAllByRole("heading", { level: 2 }).length, 6);
});
