import type { Metadata } from "next";
export const metadata: Metadata = { title: "Đơn thuê — Quản trị Rental Store" };
import { AdminOrders } from "@/components/admin/admin-orders";
export default async function Page({
  searchParams,
}: PageProps<"/admin/orders">) {
  const { queue, order } = await searchParams;
  const initialQueue = typeof queue === "string" ? queue : undefined;
  const initialOrder = typeof order === "string" ? order : undefined;
  return <AdminOrders queue={initialQueue} orderId={initialOrder} />;
}
