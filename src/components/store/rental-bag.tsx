"use client";
import { useCatalogData } from "./catalog-data";
import { T, useLanguage } from "@/components/store/language-provider";

import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/page-heading";
import { WishlistButton } from "@/components/store/selection-actions";
import { useSelection } from "@/components/store/selection-provider";
import { formatPrice } from "@/lib/catalog";
import { listedSubtotal, selectedProducts } from "@/lib/rental-selection";
import { RentalRequest } from "./rental-request";

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
  const { t } = useLanguage();
  const { products } = useCatalogData();
  const { selection, dispatch, ready } = useSelection();
  const region = useRef<HTMLDivElement>(null);
  const restoreFocus = () =>
    requestAnimationFrame(() => region.current?.focus());
  const items = selectedProducts(products, selection.bag);

  if (!ready)
    return (
      <p className="store-selection-loading" role="status">
        <T>{"Loading your saved looks…"}</T>
      </p>
    );

  const empty = (
    <EmptyState title={t("A little room for your next look.")}>
      <T>
        {
          "Your rental bag is empty. Explore the collection and save a piece you would like to wear."
        }
      </T>
    </EmptyState>
  );

  return (
    <div
      ref={region}
      tabIndex={-1}
      className="store-selection-region"
      aria-label={t("Rental bag contents")}
    >
      {!items.length ? (
        empty
      ) : (
        <div className="store-bag-layout">
          <section aria-label={t("Selected looks")}>
            <div className="store-bag-heading">
              <p role="status">
                {t(
                  items.length === 1
                    ? "{count} selected look"
                    : "{count} selected looks",
                  { count: items.length },
                )}
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
                    aria-label={t("View {name}", { name: product.name })}
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
                    <p className="store-overline">
                      <T>{product.collection}</T>
                    </p>
                    <h2>
                      <Link href={`/products/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h2>
                    <p>
                      {formatPrice(product.price)}{" "}
                      <span>
                        / {product.rentalDays}
                        <T>{" days"}</T>
                      </span>
                    </p>
                    <div className="store-bag-item-actions">
                      <WishlistButton slug={product.slug} name={product.name} />
                      <Button
                        type="button"
                        variant="ghost"
                        className="store-remove"
                        aria-label={t("Remove {name} from rental bag", {
                          name: product.name,
                        })}
                        onClick={() => {
                          dispatch({
                            type: "remove-from-bag",
                            slug: product.slug,
                          });
                          restoreFocus();
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                        <T>{"Remove"}</T>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/products" className="store-text-link">
              <T>{"Continue exploring"}</T>
            </Link>
          </section>
          <aside
            className="store-bag-summary"
            aria-labelledby="bag-summary-title"
          >
            <h2 id="bag-summary-title">
              <T>{"Your selection"}</T>
            </h2>
            <dl>
              <div>
                <dt>
                  <T>{"Listed block subtotal"}</T>
                </dt>
                <dd>{formatPrice(listedSubtotal(items))}</dd>
              </div>
            </dl>
            <p>
              <T>
                {
                  "Listed prices are per rental block. Check your dates below for the final quote."
                }
              </T>
            </p>
            <RentalRequest slugs={selection.bag} />
            <details className="store-bag-help">
              <summary>
                <T>{"What should I check before renting?"}</T>
              </summary>
              <p>
                <T>
                  {
                    "Confirm garment measurements, your rental dates, availability, store pickup and return arrangements before booking. Your saved selection is a starting point, not a reservation."
                  }
                </T>
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
          <T>{"Clear bag"}</T>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="store-confirm-sheet"
        showCloseButton={false}
      >
        <SheetHeader className="p-0">
          <SheetTitle>
            <T>{"Clear your rental bag?"}</T>
          </SheetTitle>
          <SheetDescription>
            <T>
              {
                "This removes all looks from your bag. Your wishlist stays saved."
              }
            </T>
          </SheetDescription>
        </SheetHeader>
        <div className="store-confirm-actions">
          <SheetClose asChild>
            <Button type="button" variant="outline" autoFocus>
              <T>{"Keep my looks"}</T>
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
            <T>{"Yes, clear bag"}</T>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
