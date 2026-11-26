import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { Product } from "@/lib/catalog";
import { getDatabase } from "@/server/db/client";
import { mapCatalogProduct, mapContent } from "./mappers";
export const storeProducts = cache(async (): Promise<readonly Product[]> => {
  await connection();
  return (
    await getDatabase().product.findMany({
      where: { visibility: "published" },
      include: { images: true },
      orderBy: { createdAt: "asc" },
    })
  ).map(mapCatalogProduct);
});
export async function storeProduct(slug: string) {
  return (await storeProducts()).find((p) => p.slug === slug);
}
export async function publishedContent(kind: "collection" | "lookbook") {
  await connection();
  return (
    await getDatabase().editorialContent.findMany({
      where: { kind, visibility: "published" },
      include: {
        products: {
          where: { product: { visibility: "published" } },
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  ).map(mapContent);
}
