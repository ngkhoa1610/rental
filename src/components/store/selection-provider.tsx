"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/catalog";
import {
  createSelectionStore,
  selectionStorageKey,
  type SelectionAction,
  type SelectionSnapshot,
} from "@/lib/rental-selection";

const validSlugs = products.map((product) => product.slug);
const SelectionContext = createContext<
  (SelectionSnapshot & { dispatch: (action: SelectionAction) => void }) | null
>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createSelectionStore(validSlugs));
  const [message, setMessage] = useState("");
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
        setMessage("Your rental bag has been cleared.");
        return;
      }
      const product = products.find((item) => item.slug === action.slug);
      if (!product) return;
      if (action.type === "toggle-wishlist") {
        setMessage(
          before.selection.wishlist.includes(action.slug)
            ? `${product.name} removed from saved looks.`
            : `${product.name} saved to your wishlist.`,
        );
      } else {
        setMessage(
          action.type === "add-to-bag"
            ? `${product.name} added to your rental bag.`
            : `${product.name} removed from your rental bag.`,
        );
      }
    },
    [store],
  );

  useEffect(() => {
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
  }, [store]);

  return (
    <SelectionContext value={{ ...snapshot, dispatch }}>
      {children}
      <div className={message ? "selection-feedback" : undefined}>
        <p role="status" aria-live="polite" aria-atomic="true">
          {message}
          {message &&
            snapshot.persistence === "unavailable" &&
            " Device storage is unavailable; changes last for this visit only."}
        </p>
        {message && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
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
  return (
    <p className="store-persistence-note" role="status">
      {persistence === "loading" && "Loading saved selections…"}
      {persistence === "saved" &&
        "Saved on this device. Your selections do not reserve items."}
      {persistence === "unavailable" &&
        "Device storage is unavailable. Your selections may be lost when you refresh."}
    </p>
  );
}
