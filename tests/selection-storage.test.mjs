import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSelectionStore,
  decodeSelection,
  emptySelection,
  selectionStorageKey,
} from "../src/lib/rental-selection.ts";

const slugs = ["muse-dress", "luna-set", "soleil-top"];
function memoryStorage(initial = null) {
  let raw = initial;
  const writes = [];
  return {
    writes,
    getItem(key) {
      assert.equal(key, selectionStorageKey);
      return raw;
    },
    setItem(key, value) {
      assert.equal(key, selectionStorageKey);
      raw = value;
      writes.push(value);
    },
  };
}
const encoded = (selection) => JSON.stringify({ version: 1, ...selection });

test("decoder restores versioned selections and drops stale IDs/duplicates", () => {
  assert.deepEqual(
    decodeSelection(
      encoded({
        bag: ["muse-dress", "deleted", "muse-dress", 1],
        wishlist: ["luna-set"],
      }),
      slugs,
    ),
    { bag: ["muse-dress"], wishlist: ["luna-set"] },
  );
});
test("malformed, missing and unsupported storage has a safe empty state", () => {
  for (const value of [
    null,
    "{",
    "null",
    "[]",
    '"text"',
    '{"version":2,"bag":["muse-dress"]}',
  ])
    assert.deepEqual(decodeSelection(value, slugs), emptySelection);
});
test("decoder accepts only arrays and copies no unexpected fields", () => {
  assert.deepEqual(
    decodeSelection(
      '{"version":1,"bag":"muse-dress","wishlist":null,"price":1}',
      slugs,
    ),
    emptySelection,
  );
});
test("SSR snapshot is stable and cannot overwrite saved data before restoration", () => {
  const store = createSelectionStore(slugs);
  assert.equal(store.getSnapshot(), store.getServerSnapshot());
  store.dispatch({ type: "add-to-bag", slug: "muse-dress" });
  assert.equal(store.getSnapshot().ready, false);
  const storage = memoryStorage(encoded({ bag: ["luna-set"], wishlist: [] }));
  store.connect(storage);
  assert.deepEqual(store.getSnapshot().selection.bag, ["luna-set"]);
  assert.equal(storage.writes.length, 0);
  assert.equal(store.getServerSnapshot().ready, false);
});
test("saved changes survive a new provider instance (refresh)", () => {
  const storage = memoryStorage();
  const first = createSelectionStore(slugs);
  first.connect(storage);
  first.dispatch({ type: "add-to-bag", slug: "muse-dress" });
  first.dispatch({ type: "toggle-wishlist", slug: "luna-set" });
  const refreshed = createSelectionStore(slugs);
  refreshed.connect(storage);
  assert.deepEqual(refreshed.getSnapshot().selection, {
    bag: ["muse-dress"],
    wishlist: ["luna-set"],
  });
});
test("clear and remove persist without bringing old selections back", () => {
  const storage = memoryStorage(
    encoded({ bag: ["muse-dress", "luna-set"], wishlist: ["soleil-top"] }),
  );
  const store = createSelectionStore(slugs);
  store.connect(storage);
  store.dispatch({ type: "remove-from-bag", slug: "muse-dress" });
  assert.deepEqual(
    decodeSelection(storage.getItem(selectionStorageKey), slugs).bag,
    ["luna-set"],
  );
  store.dispatch({ type: "clear-bag" });
  assert.deepEqual(
    decodeSelection(storage.getItem(selectionStorageKey), slugs),
    { bag: [], wishlist: ["soleil-top"] },
  );
});
test("blocked storage read still permits in-memory actions", () => {
  const store = createSelectionStore(slugs);
  store.connect({
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("SecurityError");
    },
  });
  store.dispatch({ type: "add-to-bag", slug: "muse-dress" });
  assert.equal(store.getSnapshot().persistence, "unavailable");
  assert.deepEqual(store.getSnapshot().selection.bag, ["muse-dress"]);
});
test("quota failure retains existing and newly added selections", () => {
  const store = createSelectionStore(slugs);
  store.connect({
    getItem: () => encoded({ bag: ["muse-dress"], wishlist: [] }),
    setItem() {
      throw new Error("QuotaExceededError");
    },
  });
  store.dispatch({ type: "add-to-bag", slug: "luna-set" });
  assert.deepEqual(store.getSnapshot().selection.bag, [
    "muse-dress",
    "luna-set",
  ]);
  assert.equal(store.getSnapshot().persistence, "unavailable");
});
test("refresh applies another tab's change and storage clearing", () => {
  const storage = memoryStorage();
  const store = createSelectionStore(slugs);
  store.connect(storage);
  storage.setItem(
    selectionStorageKey,
    encoded({ bag: ["soleil-top"], wishlist: [] }),
  );
  store.refresh();
  assert.deepEqual(store.getSnapshot().selection.bag, ["soleil-top"]);
  storage.setItem(selectionStorageKey, null);
  store.refresh();
  assert.deepEqual(store.getSnapshot().selection, emptySelection);
});
test("subscribers unsubscribe cleanly and duplicate additions do not write again", () => {
  const storage = memoryStorage();
  const store = createSelectionStore(slugs);
  store.connect(storage);
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);
  store.dispatch({ type: "add-to-bag", slug: "muse-dress" });
  store.dispatch({ type: "add-to-bag", slug: "muse-dress" });
  assert.equal(storage.writes.length, 1);
  assert.equal(calls, 1);
  unsubscribe();
  store.dispatch({ type: "clear-bag" });
  assert.equal(calls, 1);
});
test("store instances do not leak selections between server requests", () => {
  const first = createSelectionStore(slugs);
  first.connect(memoryStorage());
  first.dispatch({ type: "add-to-bag", slug: "muse-dress" });
  assert.deepEqual(
    createSelectionStore(slugs).getSnapshot().selection,
    emptySelection,
  );
});
