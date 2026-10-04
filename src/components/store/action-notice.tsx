"use client";
import { CheckCircle2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ApiScope } from "@/lib/access";
import { useLanguage } from "./language-provider";
import { Button } from "@/components/ui/button";

export function ActionNotice({
  message,
  sequence,
  scope,
  demo,
  onDismiss,
}: {
  message: string;
  sequence: number;
  scope: ApiScope;
  demo: boolean;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();
  const path = usePathname();
  const admin = path === "/admin" || Boolean(path?.startsWith("/admin/"));
  // A root customer provider also wraps admin pages; never carry its notice across.
  if (!message || (path && admin !== (scope === "admin"))) return null;
  return (
    <aside
      className="store-action-notice"
      aria-label={t("Action result")}
      data-scope={scope}
    >
      <CheckCircle2 aria-hidden="true" />
      <div>
        <p key={sequence} role="status" aria-live="polite" aria-atomic="true">
          {t(message)}
        </p>
        {demo && (
          <small>
            {t("Demo changes stay in this tab and reset on reload.")}
          </small>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("Dismiss action notification")}
        onClick={onDismiss}
      >
        <X aria-hidden="true" />
      </Button>
    </aside>
  );
}
