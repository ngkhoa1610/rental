import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutPreview } from "@/components/layout-preview/layout-preview";
import data from "@/components/layout-preview/fixtures.json";
import "../(store)/store.css";
import "../(store)/home.css";
import "../(store)/booking.css";
import "../(store)/theme.css";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Xem trước bố cục — Rental Store",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LayoutPreview data={data} />;
}
