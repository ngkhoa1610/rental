import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sản phẩm — Quản trị Rental Store" };
import { AdminProducts } from "@/components/admin/admin-products";
export default function Page() {
  return <AdminProducts />;
}
