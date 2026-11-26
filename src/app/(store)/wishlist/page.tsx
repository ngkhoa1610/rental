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
        description="Lưu các trang phục yêu thích để dễ tìm lại khi cần."
      />
      <SelectionNotice />
      <SavedLooks />
    </>
  );
}
