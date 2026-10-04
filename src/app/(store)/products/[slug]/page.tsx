import {
  storeProduct,
  storeProducts,
  isLiveStore,
} from "@/server/rental/storefront";
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

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const product = await storeProduct((await params).slug);
  if (!product) notFound();
  const products = await storeProducts();

  return (
    <>
      <nav className="store-breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">
          <T>{"All looks"}</T>
        </Link>
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
          <p className="store-overline">
            <T>{product.collection}</T>
          </p>
          <h1 id="product-name">{product.name}</h1>
          <p className="store-detail-price">
            {formatPrice(product.price)}
            <span>
              / {product.rentalDays}
              <T>{isLiveStore() ? " days" : " days · sample price"}</T>
            </span>
          </p>
          <p>
            <T>{product.description}</T>
          </p>
          <ul className="store-tags" aria-label="Occasions">
            {product.occasions.map((occasion) => (
              <li key={occasion}>
                <span>
                  <T>{occasion}</T>
                </span>
              </li>
            ))}
          </ul>
          <ProductBooking product={product} />
          <div className="store-detail-actions">
            <AddToBagButton slug={product.slug} name={product.name} />
            <WishlistButton slug={product.slug} name={product.name} />
          </div>
          <dl className="store-product-facts">
            <div>
              <dt>
                <T>{"Category"}</T>
              </dt>
              <dd>
                <T>{product.category}</T>
              </dd>
            </div>
            <div>
              <dt>
                <T>{"Sizes & measurements"}</T>
              </dt>
              <dd>
                <T>{"To be confirmed"}</T>
              </dd>
            </div>
            <div>
              <dt>
                <T>{"Availability"}</T>
              </dt>
              <dd>
                <T>{"To be confirmed before renting"}</T>
              </dd>
            </div>
          </dl>
          <details className="store-info-details">
            <summary>
              <T>{"Fit & measurement guide"}</T>
            </summary>
            <p>
              <T>
                {
                  "Compare the garment measurements with a piece you already like wearing. For your body measurements, use a soft tape around the fullest part of your bust, your natural waist and the fullest part of your hips."
                }
              </T>
            </p>
            <p>
              <T>
                {
                  "Measurements and size options have not been supplied. Ask the store for a size recommendation."
                }
              </T>
            </p>
          </details>
          <details className="store-info-details">
            <summary>
              <T>{"Material & care"}</T>
            </summary>
            <p>
              <T>
                {
                  "Fabric composition and care instructions have not been supplied. Check the garment label and confirmed rental instructions before cleaning or altering a piece."
                }
              </T>
            </p>
          </details>
          <details className="store-info-details" open>
            <summary>
              <T>{"Before making a rental"}</T>
            </summary>
            <p>
              <T>
                {isLiveStore()
                  ? "Check dates and send a rental request. The store confirms the reservation; adding this look to your bag does not place an order."
                  : "This is a sample look. Sizes, dates, delivery, care and return terms must be confirmed before any booking. Adding it to your bag does not place an order."}
              </T>
            </p>
          </details>
        </section>
      </div>
      <section className="store-cross-sell">
        <div>
          <p className="store-overline">
            <T>{"The finishing touches"}</T>
          </p>
          <h2>
            <T>{"Complete your outfit."}</T>
          </h2>
          <p>
            <T>
              {
                "Tell the store if you would like a bag, shoes or jewellery. Models, prices and availability will be confirmed separately."
              }
            </T>
          </p>
        </div>
        <ContactOptions
          label="Ask about accessories"
          message={`Nhờ shop gợi ý phụ kiện phối với ${product.name}.`}
        />
      </section>
      <ScrollReveal>
        <section className="store-related" aria-labelledby="related-heading">
          <h2 id="related-heading">
            <T>{"A little more inspiration."}</T>
          </h2>
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
