import type { Metadata } from "next";
import { T } from "@/components/store/language-provider";
import { QuickBooking } from "@/components/store/quick-booking";
import { Catalog } from "@/components/store/catalog";
import { PageHeading } from "@/components/store/page-heading";

export const metadata: Metadata = { title: "Explore Looks — Rental Store" };

export default function ProductsPage() {
  return (
    <>
      <PageHeading
        title="A look for every plan."
        description="Explore the wardrobe. Save a favourite, or start a rental bag."
        eyebrow="Explore looks"
      />
      <details className="store-catalog-dates">
        <summary>
          <T>{"Choose dates to find available looks"}</T>
        </summary>
        <QuickBooking />
      </details>
      <Catalog />
    </>
  );
}
