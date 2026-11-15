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
              <T>{" days"}</T>
            </span>
          </p>
        </div>
        <div className="store-card-booking">
          {availability && (
            <p className="store-card-status available">
              <T>{availability}</T>
            </p>
          )}
          <div>
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
