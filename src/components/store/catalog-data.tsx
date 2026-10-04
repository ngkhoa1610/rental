"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { products as samples, type Product } from "@/lib/catalog";
import { useRentalApi } from "./api-provider";
import { useLanguage } from "./language-provider";
import { Button } from "@/components/ui/button";
const CatalogData = createContext<{
  products: readonly Product[];
  ready: boolean;
  error: string;
}>({ products: samples, ready: true, error: "" });
export function CatalogDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { api, demo } = useRentalApi(),
    path = usePathname(),
    { t } = useLanguage();
  const [value, setValue] = useState({
    products: (demo ? samples : []) as readonly Product[],
    ready: Boolean(demo),
    error: "",
  });
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (demo) return;
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
    [api, demo],
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
