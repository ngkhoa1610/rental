import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Thanh toán — Quản trị Rental Store",
};
import { AdminOrders } from "@/components/admin/admin-orders";
export default function Page() {
  return <AdminOrders paymentsOnly />;
}
