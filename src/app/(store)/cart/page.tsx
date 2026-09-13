import { SelectionNotice } from "@/components/store/selection-provider";
import type { Metadata } from "next";
import { PageHeading } from "@/components/store/page-heading";
import { RentalBag } from "@/components/store/rental-bag";

export const metadata: Metadata = { title: "Rental Bag — Rental Store" };

export default function CartPage() {
  return (
    <>
      <PageHeading
        title="Your next plans start here."
        eyebrow="Rental bag"
        description="Review the looks you are considering. No item is reserved."
      />
      <SelectionNotice />
      <RentalBag />
    </>
  );
}
