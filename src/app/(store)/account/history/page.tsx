import type { Metadata } from "next";
import { PageHeading } from "@/components/store/page-heading";
import { RentalOrders } from "@/components/store/rental-orders";
export const metadata: Metadata = { title: "Rental history — Rental Store" };
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Rental history"
        description="Your rental orders"
      />
      <RentalOrders history />
    </>
  );
}
