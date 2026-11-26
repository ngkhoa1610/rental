"use client";
import { useCatalogData } from "./catalog-data";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { categories, type Product } from "@/lib/catalog";
import { rentalDateError } from "@/lib/rental-dates";
import { ApiError } from "@/lib/api/contracts";
import { useRentalApi, useApiAction } from "./api-provider";
import { useLanguage } from "./language-provider";
import { RentalDateFields } from "./rental-date-fields";
import { ProductCard } from "./product-card";
import { BookingDrawer } from "./booking-drawer";

type Result = {
  product: Product;
  status: "available" | "unavailable" | "error";
};
export function QuickBooking({
  showHeading = true,
}: {
  showHeading?: boolean;
}) {
  const { t } = useLanguage();
  const { products } = useCatalogData();
  const { api, draft, setDraft } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const [category, setCategory] = useState("");
  const [checked, setChecked] = useState<{
    key: string;
    results: Result[];
  } | null>(null);
  const region = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([draft.pickupDate, draft.returnDate, category]);
  const result =
    !busy && !error && checked?.key === key ? checked.results : null;
  return (
    <div className="store-quick-booking" id="quick-booking" tabIndex={-1}>
      {showHeading && <h2 className="store-quick-heading">Tra lịch thuê</h2>}
      <form
        aria-label="Tra lịch thuê"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const invalid = rentalDateError(draft);
            if (invalid) throw new Error(invalid);
            const items = products.filter(
              (p) => !category || p.category === category,
            );
            const results = await Promise.all(
              items.map(async (product): Promise<Result> => {
                try {
                  await api.call("availability.quote", {
                    items: [{ productSlug: product.slug, quantity: 1 }],
                    pickupDate: draft.pickupDate,
                    returnDate: draft.returnDate,
                  });
                  return { product, status: "available" };
                } catch (failure) {
                  if (
                    failure instanceof ApiError &&
                    failure.code === "UNAVAILABLE"
                  )
                    return { product, status: "unavailable" };
                  if (
                    failure instanceof ApiError &&
                    failure.code === "POLICY_REQUIRED"
                  )
                    throw failure;
                  return { product, status: "error" };
                }
              }),
            );
            setChecked({ key, results });
            requestAnimationFrame(() => region.current?.focus());
          });
        }}
        className="store-quick-form"
      >
        <RentalDateFields
          dates={draft}
          disabled={busy}
          onChange={(dates) =>
            setDraft((previous) => ({ ...previous, ...dates }))
          }
        />
        <label>
          {t("Category")}
          <select
            value={category}
            disabled={busy}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t("All categories")}</option>
            {[...categories, "Accessories"].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="home-cta" disabled={busy}>
          {t("Check availability")}
        </Button>
      </form>
      {busy && (
        <p role="status" className="store-api-hint">
          {t("Checking dates…")}
        </p>
      )}
      {error && (
        <p role="alert" className="store-api-error">
          {t(error)}
        </p>
      )}
      {result && (
        <div ref={region} tabIndex={-1} className="store-quick-results">
          <p role="status">
            {t("{count} looks available for your dates", {
              count: result.filter((r) => r.status === "available").length,
            })}
          </p>
          {result.some((r) => r.status === "error") && (
            <p role="alert">
              {t("Some dates could not be checked. Try again before booking.")}
            </p>
          )}
          {!result.some((r) => r.status === "available") && (
            <p>
              {t(
                "Try different dates or another category. No item is reserved yet.",
              )}
            </p>
          )}
          <div className="store-product-grid">
            {result
              .filter((r) => r.status === "available")
              .map(({ product }) => (
                <div key={product.slug}>
                  <ProductCard
                    product={product}
                    availability="Available for selected dates"
                  />
                  <BookingDrawer slugs={[product.slug]} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
