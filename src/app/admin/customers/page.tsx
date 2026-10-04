import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Khách hàng — Quản trị Rental Store",
};
import { AdminCustomers } from "@/components/admin/admin-customers";
export default function Page() {
  return <AdminCustomers />;
}
