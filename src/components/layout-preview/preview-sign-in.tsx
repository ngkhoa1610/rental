"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

const previewRoles = ["customer", "admin"] as const;
type PreviewRole = (typeof previewRoles)[number];
export type PreviewAccounts = Record<
  PreviewRole,
  { email: string; password: string }
>;

export function PreviewSignIn({
  accounts,
  customer,
  admin,
}: {
  accounts: PreviewAccounts;
  customer: ReactNode;
  admin: ReactNode;
}) {
  const [role, setRole] = useState<PreviewRole | undefined>();
  const [hasError, setHasError] = useState(false);
  const headingId = useId();
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const signOut = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (role) signOut.current?.focus();
    else email.current?.focus();
  }, [role]);

  return (
    <>
      <section className="store-api-panel" aria-labelledby={headingId}>
        <h2 id={headingId} className="text-2xl font-semibold">
          Đăng nhập mô phỏng
        </h2>
        {role ? (
          <>
            <p role="status">
              Đang xem bố cục mẫu với vai trò{" "}
              {role === "customer" ? "Khách" : "Admin"}.
            </p>
            <button
              ref={signOut}
              type="button"
              className="home-cta-ghost"
              onClick={() => {
                moveFocus.current = true;
                setRole(undefined);
              }}
            >
              Đăng xuất mô phỏng
            </button>
          </>
        ) : (
          <>
            <details className="store-api-hint">
              <summary>Xem email và mật khẩu mẫu</summary>
              <dl className="store-receipt-details mt-2">
                {previewRoles.map((candidate) => (
                  <div key={candidate}>
                    <dt>{candidate === "customer" ? "Khách" : "Admin"}</dt>
                    <dd className="break-all">
                      <code>{accounts[candidate].email}</code>
                      <br />
                      <code>{accounts[candidate].password}</code>
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
            <form
              className="store-api-form"
              autoComplete="off"
              onSubmit={(event) => {
                event.preventDefault();
                const enteredEmail = email.current?.value.trim().toLowerCase();
                const nextRole = previewRoles.find(
                  (candidate) =>
                    accounts[candidate].email === enteredEmail &&
                    accounts[candidate].password === password.current?.value,
                );
                setHasError(!nextRole);
                if (nextRole) {
                  moveFocus.current = true;
                  setRole(nextRole);
                }
              }}
            >
              <div className="store-api-fields">
                <label>
                  Email mẫu
                  <input ref={email} type="email" required />
                </label>
                <label>
                  Mật khẩu mẫu
                  <input ref={password} type="password" required />
                </label>
              </div>
              {hasError && (
                <p className="store-api-error" role="alert">
                  Email hoặc mật khẩu mẫu chưa đúng.
                </p>
              )}
              <button type="submit" className="home-cta">
                Đăng nhập mô phỏng
              </button>
            </form>
          </>
        )}
      </section>
      {role === "customer" && customer}
      {role === "admin" && admin}
    </>
  );
}
