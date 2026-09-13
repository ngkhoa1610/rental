"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/page-heading";
import { WishlistButton } from "@/components/store/selection-actions";
import { useSelection } from "@/components/store/selection-provider";
import { formatPrice, products } from "@/lib/catalog";
import { sampleSubtotal, selectedProducts } from "@/lib/rental-selection";

export function RentalBag() {
  const { selection, dispatch, ready } = useSelection();
  const items = selectedProducts(products, selection.bag);

  if (!ready)
    return (
      <p className="store-selection-loading" role="status">
        Loading your saved looks…
      </p>
    );

  if (!items.length)
    return (
      <EmptyState title="A little room for your next look.">
        Your rental bag is empty. Explore the collection and save a piece you
        would like to wear.
      </EmptyState>
    );

  return (
    <div className="store-bag-layout">
      <section aria-label="Selected looks">
        <div className="store-bag-heading">
          <p role="status">
            {items.length} selected {items.length === 1 ? "look" : "looks"}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="store-remove"
            onClick={() => dispatch({ type: "clear-bag" })}
          >
            Clear bag
          </Button>
        </div>
        <ul className="store-bag-list">
          {items.map((product) => (
            <li key={product.slug} className="store-bag-item">
              <Link
                href={`/products/${product.slug}`}
                className="store-bag-photo"
                aria-label={`View ${product.name}`}
                tabIndex={-1}
              >
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="120px"
                />
              </Link>
              <div className="store-bag-item-copy">
                <p className="store-overline">{product.collection}</p>
                <h2>
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                </h2>
                <p>
                  {formatPrice(product.price)}{" "}
                  <span>/ {product.rentalDays} days · sample</span>
                </p>
                <div className="store-bag-item-actions">
                  <WishlistButton slug={product.slug} name={product.name} />
                  <Button
                    type="button"
                    variant="ghost"
                    className="store-remove"
                    aria-label={`Remove ${product.name} from rental bag`}
                    onClick={() =>
                      dispatch({ type: "remove-from-bag", slug: product.slug })
                    }
                  >
                    <Trash2 aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/products" className="store-text-link">
          Continue exploring
        </Link>
      </section>
      <aside className="store-bag-summary" aria-labelledby="bag-summary-title">
        <h2 id="bag-summary-title">Your selection</h2>
        <dl>
          <div>
            <dt>Sample price subtotal</dt>
            <dd>{formatPrice(sampleSubtotal(items))}</dd>
          </div>
        </dl>
        <p>
          This is a preview, not a quote. Sizes, rental dates, availability and
          any additional charges have not been confirmed.
        </p>
        <div className="store-summary-note">
          <strong>No booking has been placed.</strong>
          <p>
            Checkout will be available once rental and payment arrangements are
            defined.
          </p>
        </div>
        <Link href="/#faq" className="store-text-link">
          Before you rent
        </Link>
      </aside>
    </div>
  );
}
