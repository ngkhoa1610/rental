"use client";
import { useCatalogData } from "./catalog-data";
import { useRef, useState } from "react";
import { CalendarDays, ArrowRight } from "lucide-react";
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
export function QuickBooking() {
  const { t } = useLanguage();
  const { products } = useCatalogData();
  const { api, draft, setDraft, demo } = useRentalApi();
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
      <div className="store-quick-heading">
        <span>
          <CalendarDays aria-hidden="true" />
        </span>
        <div>
          <h2>{t("When do you need your look?")}</h2>
          <p>{t("Pick your dates. Find your possibilities.")}</p>
        </div>
      </div>
      <form
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
          {t(busy ? "Checking dates…" : "Find available looks")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
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
            })}{" "}
            {demo && <span>· {t("Sample availability")}</span>}
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
