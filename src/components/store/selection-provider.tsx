"use client";
import { useLanguage } from "@/components/store/language-provider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalogData } from "./catalog-data";
import {
  createSelectionStore,
  selectionStorageKey,
  type SelectionAction,
  type SelectionSnapshot,
} from "@/lib/rental-selection";

const SelectionContext = createContext<
  (SelectionSnapshot & { dispatch: (action: SelectionAction) => void }) | null
>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { products, ready: catalogReady } = useCatalogData();
  const slugKey = JSON.stringify(products.map((p) => p.slug));
  const store = useMemo(
    () => createSelectionStore(JSON.parse(slugKey) as string[]),
    [slugKey],
  );
  const [message, setMessage] = useState({ text: "", name: "" });
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const dispatch = useCallback(
    (action: SelectionAction) => {
      const before = store.getSnapshot();
      if (!before.ready) return;
      store.dispatch(action);
      if (store.getSnapshot().selection === before.selection) return;
      if (action.type === "clear-bag") {
        setMessage({ text: "Your rental bag has been cleared.", name: "" });
        return;
      }
      const product = products.find((item) => item.slug === action.slug);
      if (!product) return;
      if (action.type === "toggle-wishlist") {
        setMessage({
          text: before.selection.wishlist.includes(action.slug)
            ? "{name} removed from saved looks."
            : "{name} saved to your wishlist.",
          name: product.name,
        });
      } else {
        setMessage({
          text:
            action.type === "add-to-bag"
              ? "{name} added to your rental bag."
              : "{name} removed from your rental bag.",
          name: product.name,
        });
      }
    },
    [store, products],
  );

  useEffect(() => {
    if (!catalogReady) return;
    // Access is inside these methods so even a blocked localStorage getter is caught.
    const disconnect = store.connect({
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
    });
    const sync = (event: StorageEvent) => {
      if (event.key === selectionStorageKey || event.key === null)
        store.refresh();
    };
    window.addEventListener("storage", sync);
    return () => {
      disconnect();
      window.removeEventListener("storage", sync);
    };
  }, [store, catalogReady]);

  return (
    <SelectionContext value={{ ...snapshot, dispatch }}>
      {children}
      <div className={message.text ? "selection-feedback" : undefined}>
        <p role="status" aria-live="polite" aria-atomic="true">
          {t(message.text, { name: message.name })}
          {message.text &&
            snapshot.persistence === "unavailable" &&
            t(
              " Device storage is unavailable; changes last for this visit only.",
            )}
        </p>
        {message.text && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Dismiss notification")}
            onClick={() => setMessage({ text: "", name: "" })}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
    </SelectionContext>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context)
    throw new Error("useSelection must be used inside SelectionProvider");
  return context;
}

export function SelectionNotice() {
  const { persistence } = useSelection();
  const { t } = useLanguage();
  return (
    <p className="store-persistence-note" role="status">
      {persistence === "loading" && t("Loading saved selections…")}
      {persistence === "saved" &&
        t("Saved on this device. Your selections do not reserve items.")}
      {persistence === "unavailable" &&
        t(
          "Device storage is unavailable. Your selections may be lost when you refresh.",
        )}
    </p>
  );
}
