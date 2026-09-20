import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";
import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/store/page-heading";
import { collections, getProduct } from "@/lib/catalog";

export const metadata: Metadata = { title: "Collections — Rental Store" };

export default function CollectionsPage() {
  return (
    <>
      <PageHeading
        title="Start with a feeling."
        eyebrow="Collections"
        description="Three small edits, each with a different plan in mind. Explore our sample wardrobe."
      />
      <div className="store-collection-list">
        {collections.map((collection, index) => {
          const product = getProduct(collection.productSlug);
          if (!product) return null;
          return (
            <article className="store-collection" key={collection.name}>
              <div className="store-collection-photo">
                <FashionImage
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, 450px"
                />
              </div>
              <ScrollReveal className="store-collection-copy">
                <span className="store-overline">
                  0{index + 1} / {collection.name}
                </span>
                <h2>{collection.title}</h2>
                <p>{collection.description}</p>
                <Link
                  href={`/products/${product.slug}`}
                  className="store-text-link"
                >
                  View {product.name} <ArrowUpRight aria-hidden="true" />
                </Link>
              </ScrollReveal>
            </article>
          );
        })}
      </div>
    </>
  );
}
