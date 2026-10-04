"use client";
import { T, useLanguage } from "@/components/store/language-provider";

import Link from "next/link";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/components/store/selection-provider";

interface ProductActionProps {
  slug: string;
  name: string;
  onRemove?: () => void;
}

export function WishlistButton({ slug, name, onRemove }: ProductActionProps) {
  const { t } = useLanguage();
  const { selection, dispatch, ready } = useSelection();
  const saved = selection.wishlist.includes(slug);
  return (
    <Button
      type="button"
      variant="outline"
      className="store-save-button"
      aria-label={t(
        saved ? "Remove {name} from wishlist" : "Save {name} to wishlist",
        { name },
      )}
      aria-pressed={saved}
      disabled={!ready}
      onClick={() => {
        dispatch({ type: "toggle-wishlist", slug });
        if (saved) onRemove?.();
      }}
    >
      <Heart aria-hidden="true" fill={saved ? "currentColor" : "none"} />
    </Button>
  );
}

export function AddToBagButton({ slug, name }: ProductActionProps) {
  const { t } = useLanguage();
  const { selection, dispatch, ready } = useSelection();
  const added = selection.bag.includes(slug);
  return (
    <div className="store-add-actions">
      <Button
        type="button"
        className="home-cta store-add-button"
        onClick={() => dispatch({ type: "add-to-bag", slug })}
        disabled={!ready || added}
      >
        {added ? (
          <Check aria-hidden="true" />
        ) : (
          <ShoppingBag aria-hidden="true" />
        )}
        <T>{added ? "In your rental bag" : "Add to rental bag"}</T>
      </Button>
      <p className="store-action-feedback" aria-live="polite">
        {added ? (
          <>
            {name}
            <T>{" added. "}</T>
            <Link href="/cart">
              <T>{"View your bag"}</T>
            </Link>
          </>
        ) : (
          t("Save your selection. This does not reserve an item.")
        )}
      </p>
    </div>
  );
}

export function BagCount() {
  const { t } = useLanguage();
  const { selection, ready } = useSelection();
  return (
    <span
      aria-label={t(
        ready ? "{count} looks in rental bag" : "Loading rental bag",
        { count: selection.bag.length },
      )}
      className="store-bag-count"
    >
      {ready ? selection.bag.length : "…"}
    </span>
  );
}
