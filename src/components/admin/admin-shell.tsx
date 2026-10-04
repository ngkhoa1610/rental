"use client";
import { AuthSignIn } from "@/components/store/auth-sign-in";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminNavigation, can } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { useApiAction, useRentalApi } from "@/components/store/api-provider";
import {
  LanguageSwitch,
  useLanguage,
} from "@/components/store/language-provider";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { t } = useLanguage();
  const { api, demo, session, ready, sessionError, refreshSession, notify } =
    useRentalApi();
  const { busy, error, run } = useApiAction();
  const [notice, setNotice] = useState("");
  const item = adminNavigation.find((item) => item.href === path);
  const allowed = can(session.profile, item?.permission);
  return (
    <div className="admin-workspace">
      <a className="home-skip" href="#admin-main">
        {t("Skip to content")}
      </a>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          RENTAL <span>STUDIO / ADMIN</span>
        </div>
        <p>{t("Store operations")}</p>
        <nav aria-label={t("Administration")}>
          {session.profile &&
            adminNavigation
              .filter((item) => can(session.profile, item.permission))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={path === item.href ? "page" : undefined}
                >
                  {t(item.label)}
                </Link>
              ))}
        </nav>
        <div className="admin-identity">
          <LanguageSwitch />
          {session.profile && (
            <>
              <strong>{session.profile.name}</strong>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await api.call("session.logout", undefined);
                    await refreshSession();
                  })
                }
              >
                {t("Sign out")}
              </Button>
            </>
          )}
        </div>
      </aside>
      <main id="admin-main" className="admin-main" tabIndex={-1}>
        <header className="admin-heading">
          <p>RENTAL STORE / {t("Administration")}</p>
          <h1>
            {t(
              path === "/admin/login"
                ? "Admin sign in"
                : (item?.label ?? "Administration"),
            )}
          </h1>
        </header>
        {demo && (
          <details className="admin-demo">
            <summary>{t("Prototype · sample data only")}</summary>
            <p>
              {t(
                "Changes stay in this tab and reset on reload. Catalog and content edits do not publish to the customer storefront.",
              )}
            </p>
            {session.profile && (
              <div className="store-api-actions">
                {can(session.profile, "staff:manage") && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        demo.seedDemoData();
                        setNotice(
                          "Sample data loaded. Refresh the current list.",
                        );
                      })
                    }
                  >
                    {t("Load sample data")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    demo.expireSession();
                    notify("Sample session expired.");
                    void refreshSession();
                  }}
                >
                  {t("Expire session")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    demo.failNext();
                    setNotice(
                      "Next request will simulate a connection failure.",
                    );
                  }}
                >
                  {t("Fail next API request")}
                </Button>
              </div>
            )}
          </details>
        )}
        {(error || sessionError) && (
          <div role="alert">
            <p>{t(error || sessionError)}</p>
            <Button onClick={() => void refreshSession()}>
              {t("Retry account")}
            </Button>
          </div>
        )}
        {notice && <p role="status">{t(notice)}</p>}
        {!ready ? (
          <p role="status">{t("Loading account…")}</p>
        ) : !session.profile ? (
          <section className="admin-panel">
            <h2>{t("Admin sign in")}</h2>
            <p>{t("A separate staff session is required.")}</p>
            {path !== "/admin/login" ? (
              <Link className="store-text-link" href="/admin/login">
                {t("Admin sign in")}
              </Link>
            ) : demo ? (
              <div className="store-api-actions">
                {(["admin", "staff"] as const).map((identity) => (
                  <Button
                    key={identity}
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        notify("");
                        demo.signIn(identity);
                        if (await refreshSession())
                          notify("Signed in successfully.");
                      })
                    }
                  >
                    {t(`Use ${identity}`)}
                  </Button>
                ))}
              </div>
            ) : (
              <AuthSignIn scope="admin" />
            )}
          </section>
        ) : path === "/admin/login" ? (
          <Link className="store-text-link" href="/admin">
            {t("Open overview")}
          </Link>
        ) : allowed ? (
          <div className="admin-body" key={session.profile.id}>
            {children}
          </div>
        ) : (
          <section role="alert" className="admin-panel">
            <h2>{t("Access denied")}</h2>
            <p>{t("Your account cannot perform this action.")}</p>
          </section>
        )}
      </main>
    </div>
  );
}
