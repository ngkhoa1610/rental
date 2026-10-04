import { T } from "@/components/store/language-provider";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
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
  const live = process.env.NEXT_PUBLIC_RENTAL_API_MODE === "http";
  return (
    <ScrollReveal>
      <article className="store-product-card">
        <div className="store-card-media">
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
            tabIndex={-1}
          >
            <FashionImage
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 350px"
            />
          </Link>
          <WishlistButton
            slug={product.slug}
            name={product.name}
            onRemove={onUnsave}
          />
          <span className="store-image-label">
            <T>{live ? "Rental look" : "Sample look"}</T>
          </span>
        </div>
        <div className="store-card-meta">
          <div>
            <p className="store-overline">
              <T>{product.collection}</T>
            </p>
            <h2>
              <Link href={`/products/${product.slug}`}>{product.name}</Link>
            </h2>
          </div>
          <p className="store-price">
            <strong>{formatPrice(product.price)}</strong>
            <span>
              / {product.rentalDays}
              <T>{live ? " days" : " days · sample"}</T>
            </span>
          </p>
        </div>
        <div className="store-card-booking">
          <p
            className={
              availability ? "store-card-status available" : "store-card-status"
            }
          >
            <T>{availability || "Choose dates to check"}</T>
          </p>
          <div>
            <span>
              <T>{"Fit advice available"}</T>
            </span>
            <Link
              href={`/products/${product.slug}`}
              className="store-text-link"
            >
              <T>{"View available dates"}</T> ↗
            </Link>
          </div>
        </div>
      </article>
    </ScrollReveal>
  );
}
