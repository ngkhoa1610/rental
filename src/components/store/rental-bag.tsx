"use client";

import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/page-heading";
import { WishlistButton } from "@/components/store/selection-actions";
import { useSelection } from "@/components/store/selection-provider";
import { formatPrice, products } from "@/lib/catalog";
import { sampleSubtotal, selectedProducts } from "@/lib/rental-selection";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function RentalBag() {
  const { selection, dispatch, ready } = useSelection();
  const region = useRef<HTMLDivElement>(null);
  const restoreFocus = () =>
    requestAnimationFrame(() => region.current?.focus());
  const items = selectedProducts(products, selection.bag);

  if (!ready)
    return (
      <p className="store-selection-loading" role="status">
        Loading your saved looks…
      </p>
    );

  const empty = (
    <EmptyState title="A little room for your next look.">
      Your rental bag is empty. Explore the collection and save a piece you
      would like to wear.
    </EmptyState>
  );

  return (
    <div
      ref={region}
      tabIndex={-1}
      className="store-selection-region"
      aria-label="Rental bag contents"
    >
      {!items.length ? (
        empty
      ) : (
        <div className="store-bag-layout">
          <section aria-label="Selected looks">
            <div className="store-bag-heading">
              <p role="status">
                {items.length} selected {items.length === 1 ? "look" : "looks"}
              </p>
              <ClearBagButton
                onConfirm={() => {
                  dispatch({ type: "clear-bag" });
                  restoreFocus();
                }}
              />
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
                    <FashionImage
                      src={product.image}
                      alt={product.imageAlt}
                      fill
                      sizes="120px"
                    />
                  </Link>
                  <div className="store-bag-item-copy">
                    <p className="store-overline">{product.collection}</p>
                    <h2>
                      <Link href={`/products/${product.slug}`}>
                        {product.name}
                      </Link>
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
                        onClick={() => {
                          dispatch({
                            type: "remove-from-bag",
                            slug: product.slug,
                          });
                          restoreFocus();
                        }}
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
          <aside
            className="store-bag-summary"
            aria-labelledby="bag-summary-title"
          >
            <h2 id="bag-summary-title">Your selection</h2>
            <dl>
              <div>
                <dt>Sample price subtotal</dt>
                <dd>{formatPrice(sampleSubtotal(items))}</dd>
              </div>
            </dl>
            <p>
              This is a preview, not a quote. Sizes, rental dates, availability
              and any additional charges have not been confirmed.
            </p>
            <div className="store-summary-note">
              <strong>No booking has been placed.</strong>
              <p>
                Online booking is not available yet. Keep your selection here
                while you plan your look.
              </p>
            </div>
            <details className="store-bag-help">
              <summary>What should I check before renting?</summary>
              <p>
                Confirm garment measurements, your rental dates, availability,
                delivery and return arrangements before booking. Your saved
                selection is a starting point, not a reservation.
              </p>
            </details>
          </aside>
        </div>
      )}
    </div>
  );
}

function ClearBagButton({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" className="store-remove">
          Clear bag
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="store-confirm-sheet"
        showCloseButton={false}
      >
        <SheetHeader className="p-0">
          <SheetTitle>Clear your rental bag?</SheetTitle>
          <SheetDescription>
            This removes all looks from your bag. Your wishlist stays saved.
          </SheetDescription>
        </SheetHeader>
        <div className="store-confirm-actions">
          <SheetClose asChild>
            <Button type="button" variant="outline" autoFocus>
              Keep my looks
            </Button>
          </SheetClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            Yes, clear bag
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
