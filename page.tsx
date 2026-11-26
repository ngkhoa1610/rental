// src/app/(store)/products/[slug]/page.tsx
import "../../products.css";
import { storeProduct, storeProducts } from "@/server/rental/storefront";
import { T } from "@/components/store/language-provider";
import type { Metadata } from "next";
import { ProductBooking } from "@/components/store/product-booking";
import { ContactOptions } from "@/components/store/contact-options";
import { ProductGallery } from "@/components/store/product-gallery";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AddToBagButton,
  WishlistButton,
} from "@/components/store/selection-actions";
import { ProductCard } from "@/components/store/product-card";
import { formatPrice } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await storeProduct((await params).slug);
  return product
    ? {
        title: `${product.name} — Rental Store`,
        description: product.description,
      }
    : { title: "Look not found — Rental Store" };
}

/* Related = same category / collection / shared occasions first, max 4. */
type Rankable = {
  slug: string;
  category: string;
  collection: string;
  occasions: readonly string[];
};

function pickRelated<P extends Rankable>(
  current: Rankable,
  all: P[],
  limit = 4,
): P[] {
  const score = (item: P) =>
    (item.category === current.category ? 2 : 0) +
    (item.collection === current.collection ? 1 : 0) +
    item.occasions.filter((o) => current.occasions.includes(o)).length;

  return all
    .filter((item) => item.slug !== current.slug)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const product = await storeProduct((await params).slug);
  if (!product) notFound();
  const relatedProducts = pickRelated(product, await storeProducts());

  return (
    <div className="store-pdp">
      <nav className="store-breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">
          <T>{"All looks"}</T>
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      {/* ───────── Zone 1: see it + decide (first viewport) ───────── */}
      <div className="store-pdp-hero">
        <div className="store-pdp-media">
          <ProductGallery
            image={product.image}
            alt={product.imageAlt}
            name={product.name}
          />
        </div>

        <section className="store-pdp-buy" aria-labelledby="product-name">
          <header className="store-pdp-head">
            <p className="store-pdp-collection">
              <T>{product.collection}</T>
            </p>
            <h1 id="product-name">{product.name}</h1>
            <div className="store-pdp-wish">
              <WishlistButton slug={product.slug} name={product.name} />
            </div>
            <p className="store-pdp-price">
              {formatPrice(product.price)}
              <span>
                / {product.rentalDays}
                <T>{" days"}</T>
              </span>
            </p>
          </header>

          {/* Primary job of the page: pick dates → send a request */}
          <div className="store-pdp-booking" id="rent">
            <ProductBooking product={product} />
            <div className="store-pdp-bag">
              <AddToBagButton slug={product.slug} name={product.name} />
            </div>
            <p className="store-pdp-note">
              <T>
                {
                  "The store confirms the reservation. Adding a look to your bag doesn’t place an order."
                }
              </T>
            </p>
          </div>

          <p className="store-pdp-desc">
            <T>{product.description}</T>
          </p>

          <ul className="store-pdp-chips" aria-label="Category and occasions">
            <li className="is-category">
              <span>
                <T>{product.category}</T>
              </span>
            </li>
            {product.occasions.map((occasion) => (
              <li key={occasion}>
                <span>
                  <T>{occasion}</T>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ───────── Zone 2: details + one place to ask the store ───────── */}
      <section className="store-pdp-info" aria-label="Look details">
        <div className="store-pdp-accordions">
          <details className="store-pdp-acc" open>
            <summary>
              <T>{"Fit & measurement guide"}</T>
            </summary>
            <div>
              <p>
                <T>
                  {
                    "Compare the garment measurements with a piece you already like wearing. For your body measurements, use a soft tape around the fullest part of your bust, your natural waist and the fullest part of your hips."
                  }
                </T>
              </p>
              <p className="store-pdp-muted">
                <T>
                  {
                    "Measurements and size options have not been supplied. Ask the store for a size recommendation."
                  }
                </T>
              </p>
            </div>
          </details>
          <details className="store-pdp-acc">
            <summary>
              <T>{"Material & care"}</T>
            </summary>
            <div>
              <p>
                <T>
                  {
                    "Fabric composition and care instructions have not been supplied. Check the garment label and confirmed rental instructions before cleaning or altering a piece."
                  }
                </T>
              </p>
            </div>
          </details>
        </div>

        <aside className="store-pdp-help" aria-labelledby="store-pdp-help-title">
          <h2 id="store-pdp-help-title">
            <T>{"Need help with size or styling?"}</T>
          </h2>
          <p>
            <T>
              {
                "Tell the store your measurements, or ask for a bag, shoes or jewellery to go with this look. Availability and prices are confirmed separately."
              }
            </T>
          </p>
          <p className="store-pdp-help-links">
            <Link href="/accessories">
              <T>{"Browse accessories"}</T>
            </Link>
            <Link href="/rental-guide">
              <T>{"How renting works"}</T>
            </Link>
          </p>
          <ContactOptions
            label="Ask the store"
            message={`Nhờ shop tư vấn size và gợi ý phụ kiện phối với ${product.name}.`}
          />
        </aside>
      </section>

      {/* ───────── Zone 3: keep browsing (max 4, ranked) ───────── */}
      {relatedProducts.length > 0 && (
        <ScrollReveal>
          <section className="store-pdp-related" aria-labelledby="related-heading">
            <h2 id="related-heading">
              <T>{"More looks"}</T>
            </h2>
            <div className="store-product-grid">
              {relatedProducts.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Mobile only: price + jump to the booking panel */}
      <div className="store-pdp-bar">
        <p className="store-pdp-bar-price">
          {formatPrice(product.price)}
          <span>
            / {product.rentalDays}
            <T>{" days"}</T>
          </span>
        </p>
        <a className="store-pdp-bar-cta" href="#rent">
          <T>{"Check dates"}</T>
        </a>
      </div>
    </div>
  );
}
