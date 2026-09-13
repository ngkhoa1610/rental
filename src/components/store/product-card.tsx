import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/components/store/selection-actions";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <ScrollReveal>
      <article className="store-product-card">
        <div className="store-card-media">
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
            tabIndex={-1}
          >
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 350px"
            />
          </Link>
          <WishlistButton slug={product.slug} name={product.name} />
          <span className="store-image-label">Sample look</span>
        </div>
        <div className="store-card-meta">
          <div>
            <p className="store-overline">{product.collection}</p>
            <h2>
              <Link href={`/products/${product.slug}`}>{product.name}</Link>
            </h2>
          </div>
          <p className="store-price">
            <strong>{formatPrice(product.price)}</strong>
            <span>/ {product.rentalDays} days · sample</span>
          </p>
        </div>
      </article>
    </ScrollReveal>
  );
}
