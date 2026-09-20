import type { Metadata } from "next";
import { ProductGallery } from "@/components/store/product-gallery";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AddToBagButton,
  WishlistButton,
} from "@/components/store/selection-actions";
import { ProductCard } from "@/components/store/product-card";
import { formatPrice, getProduct, products } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return product
    ? {
        title: `${product.name} — Rental Store`,
        description: product.description,
      }
    : { title: "Look not found — Rental Store" };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  return (
    <>
      <nav className="store-breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">All looks</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className="store-detail-grid">
        <ProductGallery
          image={product.image}
          alt={product.imageAlt}
          name={product.name}
        />
        <section className="store-detail-copy" aria-labelledby="product-name">
          <p className="store-overline">{product.collection}</p>
          <h1 id="product-name">{product.name}</h1>
          <p className="store-detail-price">
            {formatPrice(product.price)}
            <span>/ {product.rentalDays} days · sample price</span>
          </p>
          <p>{product.description}</p>
          <ul className="store-tags" aria-label="Occasions">
            {product.occasions.map((occasion) => (
              <li key={occasion}>
                <span>{occasion}</span>
              </li>
            ))}
          </ul>
          <div className="store-detail-actions">
            <AddToBagButton slug={product.slug} name={product.name} />
            <WishlistButton slug={product.slug} name={product.name} />
          </div>
          <dl className="store-product-facts">
            <div>
              <dt>Category</dt>
              <dd>{product.category}</dd>
            </div>
            <div>
              <dt>Sizes & measurements</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>To be confirmed before renting</dd>
            </div>
          </dl>
          <details className="store-info-details">
            <summary>Fit & measurement guide</summary>
            <p>
              Compare the garment measurements with a piece you already like
              wearing. For your body measurements, use a soft tape around the
              fullest part of your bust, your natural waist and the fullest part
              of your hips.
            </p>
            <p>
              Measurements and size options for this sample have not been
              supplied. A size recommendation cannot be made yet.
            </p>
          </details>
          <details className="store-info-details">
            <summary>Material & care</summary>
            <p>
              Fabric composition and care instructions have not been supplied
              for this sample. Check the garment label and confirmed rental
              instructions before cleaning or altering a piece.
            </p>
          </details>
          <details className="store-info-details" open>
            <summary>Before making a rental</summary>
            <p>
              This is a sample look. Sizes, dates, delivery, care and return
              terms must be confirmed before any booking. Adding it to your bag
              does not place an order.
            </p>
          </details>
        </section>
      </div>
      <ScrollReveal>
        <section className="store-related" aria-labelledby="related-heading">
          <h2 id="related-heading">A little more inspiration.</h2>
          <div className="store-product-grid">
            {products
              .filter((item) => item.slug !== product.slug)
              .map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
