import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Duyệt đánh giá — Quản trị Rental Store",
};
import { AdminReviews } from "@/components/admin/admin-reviews";
export default function Page() {
  return <AdminReviews />;
}
