"use client";
import { T, useLanguage } from "@/components/store/language-provider";

import { AuthSignIn } from "./auth-sign-in";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApiAction, useRentalApi } from "./api-provider";

export function SessionPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { api, demo, session, ready, sessionError, refreshSession, notify } =
    useRentalApi();
  const { busy, error, run } = useApiAction();
  const profile = session.profile;
  const [notice, setNotice] = useState("");
  return (
    <section className="store-api-panel" aria-label={t("Account session")}>
      {demo && (
        <p className="store-api-badge">
          <T>{"Interactive demo · resets on reload"}</T>
        </p>
      )}
      {!ready && (
        <p role="status">
          <T>{"Loading account…"}</T>
        </p>
      )}
      {sessionError && (
        <>
          <p role="alert">
            <T>{sessionError}</T>
          </p>
          <Button
            variant="outline"
            onClick={() => void run(refreshSession)}
            disabled={busy}
          >
            <T>{"Retry account"}</T>
          </Button>
        </>
      )}
      {ready && !profile && (
        <>
          <h2>
            <T>{"Continue with your account"}</T>
          </h2>
          <p>
            <T>
              {"Your contact details will be used for your rental request."}
            </T>
          </p>
          {demo ? (
            <div className="store-api-actions">
              <Button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    setNotice("");
                    notify("");
                    demo.signIn("customer");
                    if (await refreshSession()) {
                      notify("Signed in successfully.");
                      setNotice("Signed in successfully.");
                    }
                  })
                }
              >
                <T>{"Try customer account"}</T>
              </Button>
              {!compact && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      setNotice("");
                      notify("");
                      demo.signIn("other-customer");
                      if (await refreshSession()) {
                        notify("Signed in successfully.");
                        setNotice("Signed in successfully.");
                      }
                    })
                  }
                >
                  <T>{"Try another customer"}</T>
                </Button>
              )}
            </div>
          ) : (
            <AuthSignIn scope="customer" />
          )}
        </>
      )}
      {profile && (
        <>
          <h2>{profile.name || t("Your profile")}</h2>
          <p>{profile.phone || t("Add a contact number before submitting.")}</p>
          <details open={!profile.name || !profile.phone}>
            <summary>
              <T>{"Edit contact details"}</T>
            </summary>
            <form
              className="store-api-form"
              key={profile.id}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void run(async () => {
                  setNotice("");
                  notify("");
                  await api.call("profile.update", {
                    name: String(data.get("name") ?? ""),
                    phone: String(data.get("phone") ?? ""),
                  });
                  setNotice("Contact details saved.");
                  await refreshSession();
                });
              }}
            >
              <label>
                <T>{"Name"}</T>
                <input
                  name="name"
                  defaultValue={profile.name}
                  maxLength={100}
                  autoComplete="name"
                  required
                  disabled={busy}
                />
              </label>
              <label>
                <T>{"Phone"}</T>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone}
                  maxLength={20}
                  autoComplete="tel"
                  required
                  disabled={busy}
                />
              </label>
              <Button variant="outline" disabled={busy}>
                <T>{"Save contact details"}</T>
              </Button>
            </form>
          </details>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setNotice("");
                notify("");
                await api.call("session.logout", undefined);
                setNotice("Signed out of this workspace.");
                await refreshSession();
              })
            }
          >
            <T>{"Sign out"}</T>
          </Button>
        </>
      )}
      {notice && <p role="status">{t(notice)}</p>}
      {error && (
        <p role="alert">
          <T>{error}</T>
        </p>
      )}
    </section>
  );
}
