"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError, type ApiOperations, type Output } from "@/lib/api/contracts";
import { useRentalApi } from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
type ListOperation = {
  [K in keyof ApiOperations]: ApiOperations[K]["input"] extends void
    ? K
    : never;
}[keyof ApiOperations];
export function AdminData<K extends ListOperation>({
  operation,
  children,
  showRefresh = true,
}: {
  operation: K;
  children: (data: Output<K>, reload: (notice?: string) => void) => ReactNode;
  showRefresh?: boolean;
}) {
  const { api } = useRentalApi();
  const { t } = useLanguage();
  const [state, setState] = useState<{
    data?: Output<K>;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = (message = "") => {
    setNotice(message);
    setState({ loading: true });
    setRevision((x) => x + 1);
  };
  useEffect(() => {
    const controller = new AbortController();
    void api
      .call(operation, undefined as ApiOperations[K]["input"], {
        signal: controller.signal,
      })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      })
      .catch((error) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof ApiError && error.code === "ABORTED")
        )
          setState({ error: error.message, loading: false });
      });
    return () => controller.abort();
  }, [api, operation, revision]);
  return (
    <div className="admin-data">
      {(showRefresh || state.error) && (
        <div className="admin-toolbar">
          <Button
            variant="outline"
            disabled={state.loading}
            onClick={() => reload()}
          >
            {t("Refresh")}
          </Button>
        </div>
      )}
      {notice && <p role="status">{t(notice)}</p>}
      {state.loading ? (
        <p role="status">{t("Loading…")}</p>
      ) : state.error ? (
        <p role="alert">{t(state.error)}</p>
      ) : state.data !== undefined ? (
        children(state.data, reload)
      ) : null}
    </div>
  );
}
