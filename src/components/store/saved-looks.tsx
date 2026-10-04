"use client";
import { useCatalogData } from "./catalog-data";
import { T, useLanguage } from "@/components/store/language-provider";

import { useRef } from "react";
import { EmptyState } from "@/components/store/page-heading";
import { ProductCard } from "@/components/store/product-card";
import { useSelection } from "@/components/store/selection-provider";
import { selectedProducts } from "@/lib/rental-selection";

export function SavedLooks() {
  const { t } = useLanguage();
  const { products } = useCatalogData();
  const region = useRef<HTMLDivElement>(null);
  const { selection, ready } = useSelection();
  const saved = selectedProducts(products, selection.wishlist);
  if (!ready)
    return (
      <p className="store-selection-loading" role="status">
        <T>{"Loading your saved looks…"}</T>
      </p>
    );

  return (
    <div
      ref={region}
      tabIndex={-1}
      className="store-selection-region"
      aria-label={t("Saved looks")}
    >
      {saved.length ? (
        <>
          <p className="store-selection-count" role="status">
            {t(
              saved.length === 1 ? "{count} saved look" : "{count} saved looks",
              { count: saved.length },
            )}
          </p>
          <div className="store-product-grid">
            {saved.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                onUnsave={() =>
                  requestAnimationFrame(() => region.current?.focus())
                }
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title={t("Keep the looks you love.")}>
          <T>{"Tap the heart on a look to collect your favourites here."}</T>
        </EmptyState>
      )}
    </div>
  );
}
