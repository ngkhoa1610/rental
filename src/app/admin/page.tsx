import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Tổng quan — Quản trị Rental Store",
};
import { AdminOverview } from "@/components/admin/admin-overview";
export default function Page() {
  return <AdminOverview />;
}
