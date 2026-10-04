"use client";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { ApiScope } from "@/lib/access";
import { useApiAction, useRentalApi } from "./api-provider";
import { useLanguage } from "./language-provider";
/** Popup keeps booking dates/notes in memory while the provider handles credentials. */
export function AuthSignIn({ scope }: { scope: ApiScope }) {
  const active = useRef(true),
    popupRef = useRef<Window | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      popupRef.current?.close();
    };
  }, []);
  const { t } = useLanguage();
  const { api, refreshSession, notify } = useRentalApi();
  const { busy, error, run } = useApiAction();
  return (
    <div className="store-api-actions">
      <Button
        disabled={busy}
        onClick={() => {
          const popup = window.open(
            "about:blank",
            "rental-auth-" + scope,
            "popup,width=520,height=720",
          );
          popupRef.current = popup;
          void run(async () => {
            if (!popup)
              throw new Error(t("Allow the sign-in window and try again."));
            let succeeded = false;
            try {
              const base = scope === "admin" ? "/api/admin/auth" : "/api/auth";
              const response = await fetch(base + "/providers", {
                cache: "no-store",
              });
              if (!response.ok)
                throw new Error(
                  t("Sign-in is not configured. Please contact the store."),
                );
              const providers = (await response.json()) as Record<
                string,
                { id: string }
              >;
              const provider = Object.values(providers)[0];
              if (!provider?.id || !/^oidc-[a-f0-9]{16}$/.test(provider.id))
                throw new Error(
                  t("Sign-in is not configured. Please contact the store."),
                );
              const csrfResponse = await fetch(base + "/csrf", {
                cache: "no-store",
              });
              if (!csrfResponse.ok)
                throw new Error(t("Unable to start sign-in. Please retry."));
              const csrf = (await csrfResponse.json()) as {
                csrfToken?: string;
              };
              if (!csrf.csrfToken)
                throw new Error(t("Unable to start sign-in. Please retry."));
              const start = await fetch(base + "/signin/" + provider.id, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "X-Auth-Return-Redirect": "1",
                },
                body: new URLSearchParams({
                  csrfToken: csrf.csrfToken,
                  callbackUrl:
                    window.location.origin +
                    (scope === "admin" ? "/admin/login" : "/account"),
                }),
              });
              const result = (await start.json()) as { url?: string };
              if (
                !start.ok ||
                !result.url ||
                new URL(result.url).protocol !== "https:"
              )
                throw new Error(t("Unable to start sign-in. Please retry."));
              popup.location.href = result.url;
              for (let i = 0; i < 150; i++) {
                if (!active.current) return;
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const session = await api.call("session.get", undefined);
                if (session.profile) {
                  if (await refreshSession()) {
                    notify("Signed in successfully.");
                    succeeded = true;
                    return;
                  }
                }
                if (popup.closed)
                  throw new Error(
                    t("Sign-in was cancelled. Your draft is still here."),
                  );
              }
              throw new Error(
                t("Sign-in timed out. Your draft is still here."),
              );
            } finally {
              popup.close();
              if (!succeeded) notify("");
            }
          });
        }}
      >
        {t(busy ? "Waiting for sign-in…" : "Sign in securely")}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
