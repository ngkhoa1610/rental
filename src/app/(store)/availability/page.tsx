import type { Metadata } from "next";
import { QuickBooking } from "@/components/store/quick-booking";
import { PageHeading } from "@/components/store/page-heading";
export const metadata: Metadata = { title: "Lịch trống — Rental Store" };
export default function AvailabilityPage() {
  return (
    <>
      <PageHeading
        eyebrow="Plan your occasion"
        title="Your dates. Your possibilities."
        description="Check available looks for your pickup and return dates. The store confirms each request before reserving an item."
      />
      <QuickBooking />
    </>
  );
}
