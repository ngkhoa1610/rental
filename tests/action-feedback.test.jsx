import "./dom-setup.mjs";
import React from "react";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  cleanup,
  render,
  screen,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ApiProvider,
  useApiAction,
  useRentalApi,
} from "../src/components/store/api-provider.tsx";
import { actionSuccess } from "../src/lib/action-feedback.ts";
import { LanguageProvider } from "../src/components/store/language-provider.tsx";
function Submit() {
  const { api } = useRentalApi();
  const { busy, error, run } = useApiAction();
  return (
    <>
      <button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            await api.call("profile.update", {
              name: "Test",
              phone: "0900000000",
            });
          })
        }
      >
        Submit profile
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
test("mutation notice waits for success, prevents duplicate submit, dismisses and reports failure without stale success", async () => {
  let resolve,
    reject,
    calls = 0;
  const runtime = {
    setCsrf() {},
    api: {
      call: async (operation) => {
        if (operation === "session.get")
          return { profile: null, csrfToken: null };
        calls++;
        return new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        });
      },
    },
  };
  const user = userEvent.setup();
  render(
    <ApiProvider runtime={runtime}>
      <Submit />
    </ApiProvider>,
  );
  await user.dblClick(screen.getByRole("button", { name: "Submit profile" }));
  assert.equal(calls, 1);
  assert.equal(screen.queryByLabelText("Kết quả thao tác"), null);
  await act(async () =>
    resolve({ id: "u", name: "Test", phone: "0900000000", permissions: [] }),
  );
  const toast = await screen.findByLabelText("Kết quả thao tác");
  assert.equal(
    within(toast).getByRole("status").textContent,
    "Đã lưu thông tin liên hệ.",
  );
  await user.click(
    screen.getByRole("button", { name: "Đóng thông báo thao tác" }),
  );
  assert.equal(screen.queryByLabelText("Kết quả thao tác"), null);
  await user.click(screen.getByRole("button", { name: "Submit profile" }));
  await act(async () => reject(new Error("Connection failed")));
  assert.ok(await screen.findByRole("alert"));
  assert.equal(screen.queryByLabelText("Kết quả thao tác"), null);
});
test("all existing completed API writes have feedback; passive reads never generate success", () => {
  const expected = [
    "profile.update",
    "session.logout",
    "orders.create",
    "reviews.create",
    "admin.products.save",
    "admin.availability.save",
    "admin.availability.remove",
    "admin.reviews.moderate",
    "admin.staff.update",
    "admin.orders.transition",
  ];
  assert.deepEqual(Object.keys(actionSuccess).sort(), expected.sort());
  for (const read of [
    "session.get",
    "catalog.list",
    "availability.calendar",
    "availability.quote",
    "orders.list",
    "admin.orders.list",
  ])
    assert.equal(actionSuccess[read], undefined);
});
test("Vietnamese notification reports success without exposing submitted PII", async () => {
  const runtime = {
    setCsrf() {},
    api: {
      call: async (operation) =>
        operation === "session.get"
          ? { profile: null, csrfToken: null }
          : {
              id: "u",
              name: "Private person",
              phone: "0900000000",
              permissions: [],
            },
    },
  };
  render(
    <LanguageProvider>
      <ApiProvider runtime={runtime}>
        <Submit />
      </ApiProvider>
    </LanguageProvider>,
  );
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Submit profile" }));
  const toast = await screen.findByLabelText("Kết quả thao tác");
  await waitFor(() =>
    assert.match(toast.textContent, /Đã lưu thông tin liên hệ/),
  );
  assert.doesNotMatch(toast.textContent, /0900000000|Private person/);
});
