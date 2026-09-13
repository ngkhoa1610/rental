import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";
import { parseCatalogFilters } from "@/lib/catalog";

export const metadata: Metadata = { title: "Search — Rental Store" };

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  return (
    <CatalogView filters={parseCatalogFilters(await searchParams)} search />
  );
}
