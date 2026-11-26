import { T } from "@/components/store/language-provider";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
import type { ReactNode } from "react";
import { WishlistButton } from "@/components/store/selection-actions";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({
  product,
  onUnsave,
  availability,
}: {
  product: Product;
  onUnsave?: () => void;
  availability?: string;
}) {
  return (
    <ProductCardLayout
      product={product}
      href={`/products/${product.slug}`}
      availability={availability}
      saveControl={
        <WishlistButton
          slug={product.slug}
          name={product.name}
          onRemove={onUnsave}
        />
      }
    />
  );
}

export function ProductCardLayout({
  product,
  href,
  availability,
  saveControl,
}: {
  product: Pick<
    Product,
    "name" | "collection" | "price" | "rentalDays" | "image" | "imageAlt"
  >;
  href?: string;
  availability?: string;
  saveControl?: ReactNode;
}) {
  const image = (
    <FashionImage
      src={product.image}
      alt={product.imageAlt}
      fill
      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 350px"
    />
  );
  return (
    <ScrollReveal>
      <article className="store-product-card">
        <div className="store-card-media">
          {href ? (
            <Link href={href} aria-label={`View ${product.name}`} tabIndex={-1}>
              {image}
            </Link>
          ) : (
            image
          )}
          {saveControl}
        </div>
        <div className="store-card-meta">
          <div>
            <p className="store-overline">
              <T>{product.collection}</T>
            </p>
            <h2>
              {href ? <Link href={href}>{product.name}</Link> : product.name}
            </h2>
          </div>
          <p className="store-price">
            <strong>{formatPrice(product.price)}</strong>
            <span>
              / {product.rentalDays}
              <T>{" days"}</T>
            </span>
          </p>
        </div>
        {(availability || href) && (
          <div className="store-card-booking">
            {availability && (
              <p className="store-card-status available">
                <T>{availability}</T>
              </p>
            )}
            {href && (
              <div>
                <Link href={href} className="store-text-link">
                  <T>{"View available dates"}</T> ↗
                </Link>
              </div>
            )}
          </div>
        )}
      </article>
    </ScrollReveal>
  );
}
