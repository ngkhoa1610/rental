"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
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
    <SelectionContext value={{ ...snapshot, dispatch: store.dispatch }}>
      {children}
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
