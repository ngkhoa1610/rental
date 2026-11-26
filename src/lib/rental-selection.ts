import type { Product } from "./catalog";

/** Client-only preview selection. No quantities, stock, reservation or order state. */
export interface RentalSelection {
  readonly wishlist: readonly string[];
  readonly bag: readonly string[];
}
export type SelectionAction =
  | { type: "toggle-wishlist"; slug: string }
  | { type: "add-to-bag"; slug: string }
  | { type: "remove-from-bag"; slug: string }
  | { type: "clear-bag" };

export const emptySelection: RentalSelection = { wishlist: [], bag: [] };

export function updateSelection(
  state: RentalSelection,
  action: SelectionAction,
  validSlugs: readonly string[],
): RentalSelection {
  if (action.type === "clear-bag") return { ...state, bag: [] };
  if (!validSlugs.includes(action.slug)) return state;

  switch (action.type) {
    case "toggle-wishlist":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.slug)
          ? state.wishlist.filter((slug) => slug !== action.slug)
          : [...state.wishlist, action.slug],
      };
    case "add-to-bag":
      return state.bag.includes(action.slug)
        ? state
        : { ...state, bag: [...state.bag, action.slug] };
    case "remove-from-bag":
      return {
        ...state,
        bag: state.bag.filter((slug) => slug !== action.slug),
      };
  }
}

export function selectedProducts(
  items: readonly Product[],
  slugs: readonly string[],
): Product[] {
  return items.filter((product) => slugs.includes(product.slug));
}

/** Sum listed product prices for the bag estimate. */
export function listedSubtotal(items: readonly Product[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

export const selectionStorageKey = "rental-store.selection.v1";

/** Read only our versioned shape; remove stale IDs, duplicates and extra fields. */
export function decodeSelection(
  raw: string | null,
  validSlugs: readonly string[],
): RentalSelection {
  if (!raw) return emptySelection;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      value.version !== 1
    )
      return emptySelection;
    const record = value as Record<string, unknown>;
    const clean = (list: unknown): string[] =>
      Array.isArray(list)
        ? [
            ...new Set(
              list.filter(
                (slug): slug is string =>
                  typeof slug === "string" && validSlugs.includes(slug),
              ),
            ),
          ]
        : [];
    return { wishlist: clean(record.wishlist), bag: clean(record.bag) };
  } catch {
    return emptySelection;
  }
}

export interface SelectionSnapshot {
  selection: RentalSelection;
  ready: boolean;
  persistence: "loading" | "saved" | "unavailable";
}
interface SelectionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** One store per provider. Server rendering never reads or writes browser storage. */
export function createSelectionStore(validSlugs: readonly string[]) {
  const serverSnapshot: SelectionSnapshot = {
    selection: emptySelection,
    ready: false,
    persistence: "loading",
  };
  let snapshot = serverSnapshot;
  let storage: SelectionStorage | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: SelectionSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const read = () => {
    try {
      const selection = decodeSelection(
        storage?.getItem(selectionStorageKey) ?? null,
        validSlugs,
      );
      publish({
        selection,
        ready: true,
        persistence: storage ? "saved" : "unavailable",
      });
    } catch {
      publish({ ...snapshot, ready: true, persistence: "unavailable" });
    }
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect(adapter: SelectionStorage) {
      storage = adapter;
      read();
      return () => {
        storage = undefined;
      };
    },
    refresh: read,
    dispatch(action: SelectionAction) {
      if (!snapshot.ready) return;
      const selection = updateSelection(snapshot.selection, action, validSlugs);
      if (selection === snapshot.selection) return;
      let persistence: SelectionSnapshot["persistence"] = "unavailable";
      try {
        if (storage) {
          storage.setItem(
            selectionStorageKey,
            JSON.stringify({ version: 1, ...selection }),
          );
          persistence = "saved";
        }
      } catch {
        /* Keep the user's in-memory changes if browser storage is blocked/full. */
      }
      publish({ selection, ready: true, persistence });
    },
  };
}
