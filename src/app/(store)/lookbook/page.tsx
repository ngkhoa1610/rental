import type { Metadata } from "next";
import { PublishedEditorial } from "@/components/store/published-editorial";
import SampleLookbook from "@/components/store/sample-lookbook";
import { isLiveStore } from "@/server/rental/storefront";
export const metadata: Metadata = {
  title: "Lookbook — Rental Store",
  description: "Gợi ý phối đồ từ cửa hàng.",
};
export default function LookbookPage() {
  return isLiveStore() ? (
    <PublishedEditorial kind="lookbook" />
  ) : (
    <SampleLookbook />
  );
}
