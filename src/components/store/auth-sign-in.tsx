"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiScope } from "@/lib/access";
import { useApiAction, useRentalApi } from "./api-provider";

function credentialError(status: number, registering: boolean): string {
  if (status === 429) return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.";
  if (status === 401 || status === 403)
    return "Không thể đăng nhập bằng thông tin này. Hãy kiểm tra email và mật khẩu.";
  if (registering && (status === 400 || status === 409))
    return "Không thể đăng ký. Hãy kiểm tra thông tin hoặc đăng nhập nếu đã có tài khoản.";
  return "Không thể kết nối với dịch vụ tài khoản. Vui lòng thử lại.";
}

/** Refresh this workspace in place so an interrupted rental request stays intact. */
export function AuthSignIn({ scope }: { scope: ApiScope }) {
  const [registering, setRegistering] = useState(false);
  const { refreshSession, notify } = useRentalApi();
  const { busy, error, run, clearError } = useApiAction();
  const base = scope === "admin" ? "/api/admin/auth" : "/api/auth";
  const endpoint = base + (registering ? "/register" : "/login");
  const action = registering ? "Đăng ký" : "Đăng nhập";

  return (
    <form
      action={endpoint}
      method="post"
      className="store-api-form"
      aria-label={action}
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const credentials = {
          email: String(data.get("email") ?? "").trim(),
          password: String(data.get("password") ?? ""),
        };
        const payload = registering
          ? { ...credentials, name: String(data.get("name") ?? "").trim() }
          : credentials;
        void run(async () => {
          notify("");
          let response: Response;
          try {
            response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(15000),
            });
          } catch {
            throw new Error(credentialError(0, registering));
          }
          if (!response.ok)
            throw new Error(credentialError(response.status, registering));
          const result: unknown = await response.json().catch(() => null);
          if (
            !result ||
            typeof result !== "object" ||
            !("ok" in result) ||
            result.ok !== true
          )
            throw new Error(credentialError(0, registering));
          if (!(await refreshSession(true)))
            throw new Error("Không thể tải phiên tài khoản. Vui lòng thử lại.");
          notify(registering ? "Đã tạo tài khoản." : "Signed in successfully.");
        });
      }}
    >
      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="username"
          maxLength={254}
          required
          disabled={busy}
        />
      </label>
      {registering && (
        <label>
          Họ và tên
          <input
            name="name"
            autoComplete="name"
            maxLength={100}
            required
            disabled={busy}
          />
        </label>
      )}
      <label>
        Mật khẩu
        <input
          key={action}
          type="password"
          name="password"
          autoComplete={registering ? "new-password" : "current-password"}
          aria-describedby={registering ? "register-password-hint" : undefined}
          required
          disabled={busy}
        />
        {registering && (
          <small id="register-password-hint">Dùng từ 15 đến 128 ký tự.</small>
        )}
      </label>
      <div className="store-api-actions">
        <Button type="submit" disabled={busy}>
          {busy ? "Đang xử lý…" : action}
        </Button>
        {scope === "customer" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              clearError();
              setRegistering(!registering);
            }}
          >
            {registering ? "Đã có tài khoản" : "Tạo tài khoản"}
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
