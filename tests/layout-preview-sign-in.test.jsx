import "./dom-setup.mjs";
import React from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import fixtures from "../src/components/layout-preview/fixtures.json";
import { PreviewSignIn } from "../src/components/layout-preview/preview-sign-in.tsx";

afterEach(cleanup);

function renderPreviewSignIn() {
  return render(
    <PreviewSignIn
      accounts={fixtures.accounts}
      customer={<h2>Đơn thuê của khách</h2>}
      admin={<h2>Đơn thuê trong Admin</h2>}
    />,
  );
}

function signIn({ email, password }) {
  fireEvent.change(screen.getByLabelText("Email mẫu"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Mật khẩu mẫu"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Đăng nhập mô phỏng" }));
}

function assertNoRolePreview() {
  assert.equal(
    screen.queryByRole("heading", { name: "Đơn thuê của khách" }),
    null,
  );
  assert.equal(
    screen.queryByRole("heading", { name: "Đơn thuê trong Admin" }),
    null,
  );
}

test("demo sign-in rejects incorrect credentials and opens only the matching preview", () => {
  renderPreviewSignIn();
  assertNoRolePreview();

  signIn({
    email: fixtures.accounts.customer.email,
    password: fixtures.accounts.admin.password,
  });
  assert.match(screen.getByRole("alert").textContent, /chưa đúng/);
  assertNoRolePreview();

  signIn(fixtures.accounts.customer);
  assert.ok(screen.getByRole("heading", { name: "Đơn thuê của khách" }));
  assert.equal(
    screen.queryByRole("heading", { name: "Đơn thuê trong Admin" }),
    null,
  );
  assert.match(screen.getByRole("status").textContent, /Khách/);
  assert.equal(screen.queryByRole("alert"), null);

  const logout = screen.getByRole("button", { name: "Đăng xuất mô phỏng" });
  assert.equal(document.activeElement, logout);
  fireEvent.click(logout);
  assertNoRolePreview();
  assert.equal(document.activeElement, screen.getByLabelText("Email mẫu"));
  assert.equal(screen.getByLabelText("Mật khẩu mẫu").value, "");

  signIn(fixtures.accounts.admin);
  assert.ok(screen.getByRole("heading", { name: "Đơn thuê trong Admin" }));
  assert.equal(
    screen.queryByRole("heading", { name: "Đơn thuê của khách" }),
    null,
  );
  assert.match(screen.getByRole("status").textContent, /Admin/);
});

test("remounting the preview clears the demo sign-in state", () => {
  const preview = renderPreviewSignIn();
  signIn(fixtures.accounts.admin);
  preview.unmount();

  renderPreviewSignIn();
  assertNoRolePreview();
  assert.equal(screen.getByLabelText("Email mẫu").value, "");
  assert.equal(screen.getByLabelText("Mật khẩu mẫu").value, "");
});
