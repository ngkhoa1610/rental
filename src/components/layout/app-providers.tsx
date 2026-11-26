"use client";

import { usePathname } from "next/navigation";
import { ApiProvider } from "@/components/store/api-provider";
import { CatalogDataProvider } from "@/components/store/catalog-data";
import { SelectionProvider } from "@/components/store/selection-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (process.env.NODE_ENV === "development" && path === "/layout-preview")
    return children;

  return (
    <ApiProvider>
      <CatalogDataProvider>
        <SelectionProvider>{children}</SelectionProvider>
      </CatalogDataProvider>
    </ApiProvider>
  );
}
