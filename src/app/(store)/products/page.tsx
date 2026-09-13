import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";
import { parseCatalogFilters } from "@/lib/catalog";

export const metadata: Metadata = { title: "Explore Looks — Rental Store" };

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  return <CatalogView filters={parseCatalogFilters(await searchParams)} />;
}
