import type { Metadata } from "next";
export const metadata: Metadata = { title: "Nội dung — Quản trị Rental Store" };
import { AdminContent } from "@/components/admin/admin-content";
export default function Page() {
  return <AdminContent />;
}
