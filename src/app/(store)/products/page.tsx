// src/app/(store)/products/page.tsx
import "../products.css";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { T } from "@/components/store/language-provider";
import { QuickBooking } from "@/components/store/quick-booking";
import { Catalog } from "@/components/store/catalog";
import { PageHeading } from "@/components/store/page-heading";

export const metadata: Metadata = { title: "Explore Looks — Rental Store" };

export default function ProductsPage() {
  return (
    <div className="store-cat">
      {/* Heading on the left, the one filter that matters (dates) on the right */}
      <div className="store-cat-top">
        <PageHeading
          title="A look for every plan."
          description="Explore the wardrobe. Save a favourite, or start a rental bag."
          eyebrow="Explore looks"
        />
        <details className="store-cat-dates" open>
          <summary>
            <CalendarDays aria-hidden="true" />
            <T>{"Check available dates"}</T>
          </summary>
          <div className="store-cat-dates-body">
            <QuickBooking showHeading={false} />
          </div>
        </details>
      </div>

      <section aria-labelledby="store-catalog-heading">
        {/* Kept for screen readers; the page title already says it visually */}
        <h2 id="store-catalog-heading" className="store-cat-sr">
          <T>{"All looks"}</T>
        </h2>
        <Catalog />
      </section>
    </div>
  );
}
