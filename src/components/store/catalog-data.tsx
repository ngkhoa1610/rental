"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/catalog";
import { useRentalApi } from "./api-provider";
import { useLanguage } from "./language-provider";
import { Button } from "@/components/ui/button";
const CatalogData = createContext<{
  products: readonly Product[];
  ready: boolean;
  error: string;
}>({ products: [], ready: false, error: "" });
export function CatalogDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { api } = useRentalApi(),
    path = usePathname(),
    { t } = useLanguage();
  const [value, setValue] = useState({
    products: [] as readonly Product[],
    ready: false,
    error: "",
  });
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const products = await api.call("catalog.list", {}, { signal });
        if (!signal?.aborted) setValue({ products, ready: true, error: "" });
      } catch (e) {
        if (!signal?.aborted)
          setValue((p) => ({
            ...p,
            ready: false,
            error: e instanceof Error ? e.message : "Unable to load products.",
          }));
      }
    },
    [api],
  );
  useEffect(() => {
    const controller = new AbortController(),
      refresh = () => void load(controller.signal);
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [load]);
  return (
    <CatalogData value={value}>
      {value.error && !path?.startsWith("/admin") && (
        <div className="store-api-panel" role="alert">
          <p>{t(value.error)}</p>
          <Button onClick={() => void load()}>{t("Retry")}</Button>
        </div>
      )}
      {children}
    </CatalogData>
  );
}
export function useCatalogData() {
  return useContext(CatalogData);
}
