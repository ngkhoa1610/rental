"use client";

import { EmptyState } from "@/components/store/page-heading";
import { ProductCard } from "@/components/store/product-card";
import { useSelection } from "@/components/store/selection-provider";
import { products } from "@/lib/catalog";
import { selectedProducts } from "@/lib/rental-selection";

export function SavedLooks() {
  const { selection, ready } = useSelection();
  const saved = selectedProducts(products, selection.wishlist);
  if (!ready)
    return (
      <p className="store-selection-loading" role="status">
        Loading your saved looks…
      </p>
    );

  return saved.length ? (
    <>
      <p className="store-selection-count" role="status">
        {saved.length} saved {saved.length === 1 ? "look" : "looks"}
      </p>
      <div className="store-product-grid">
        {saved.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  ) : (
    <EmptyState title="Keep the looks you love.">
      Tap the heart on a look to collect your favourites here.
    </EmptyState>
  );
}
