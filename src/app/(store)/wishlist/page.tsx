import { SelectionNotice } from "@/components/store/selection-provider";
import type { Metadata } from "next";
import { PageHeading } from "@/components/store/page-heading";
import { SavedLooks } from "@/components/store/saved-looks";

export const metadata: Metadata = { title: "Wishlist — Rental Store" };

export default function WishlistPage() {
  return (
    <>
      <PageHeading
        title="Your favourites, together."
        eyebrow="Wishlist"
        description="A little inspiration to come back to. Keep your favourite sample looks together."
      />
      <SelectionNotice />
      <SavedLooks />
    </>
  );
}
