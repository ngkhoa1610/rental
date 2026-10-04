import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Lịch khả dụng — Quản trị Rental Store",
};
import { AdminAvailability } from "@/components/admin/admin-availability";
export default function Page() {
  return <AdminAvailability />;
}
