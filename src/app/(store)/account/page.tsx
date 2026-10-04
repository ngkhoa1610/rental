import type { Metadata } from "next";
import { PageHeading } from "@/components/store/page-heading";
export const metadata: Metadata = { title: "Hồ sơ — Rental Store" };
export default function AccountPage() {
  return (
    <PageHeading
      eyebrow="Your account"
      title="Your profile"
      description="Manage contact details, follow your rental requests and ask for changes."
    />
  );
}
