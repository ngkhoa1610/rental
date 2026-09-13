import assert from "node:assert/strict";
import { test } from "node:test";
import { products } from "../src/lib/catalog.ts";
import {
  emptySelection,
  updateSelection,
  selectedProducts,
  sampleSubtotal,
} from "../src/lib/rental-selection.ts";

const slugs = products.map((item) => item.slug);
const apply = (state, action) => updateSelection(state, action, slugs);

test("wishlist toggles a look without changing the rental bag", () => {
  const saved = apply(emptySelection, {
    type: "toggle-wishlist",
    slug: "muse-dress",
  });
  assert.deepEqual(saved, { wishlist: ["muse-dress"], bag: [] });
  assert.deepEqual(
    apply(saved, { type: "toggle-wishlist", slug: "muse-dress" }),
    emptySelection,
  );
});
test("adding the same look twice is idempotent", () => {
  const state = apply(emptySelection, { type: "add-to-bag", slug: "luna-set" });
  assert.equal(apply(state, { type: "add-to-bag", slug: "luna-set" }), state);
});
test("remove only removes the requested bag item", () => {
  const state = { wishlist: ["muse-dress"], bag: ["muse-dress", "luna-set"] };
  assert.deepEqual(
    apply(state, { type: "remove-from-bag", slug: "luna-set" }),
    { wishlist: ["muse-dress"], bag: ["muse-dress"] },
  );
});
test("clearing bag preserves wishlist", () => {
  assert.deepEqual(
    apply(
      { wishlist: ["muse-dress"], bag: ["luna-set"] },
      { type: "clear-bag" },
    ),
    { wishlist: ["muse-dress"], bag: [] },
  );
});
test("unknown slugs cannot enter either selection", () => {
  for (const type of ["toggle-wishlist", "add-to-bag", "remove-from-bag"]) {
    assert.equal(
      apply(emptySelection, { type, slug: "unknown" }),
      emptySelection,
    );
  }
});
test("reducer does not mutate frozen source arrays", () => {
  const state = Object.freeze({
    wishlist: Object.freeze([]),
    bag: Object.freeze([]),
  });
  apply(state, { type: "toggle-wishlist", slug: "muse-dress" });
  apply(state, { type: "add-to-bag", slug: "luna-set" });
  assert.deepEqual(state, emptySelection);
});
test("derived selections ignore invalid and duplicated IDs", () => {
  const items = selectedProducts(products, [
    "muse-dress",
    "unknown",
    "muse-dress",
  ]);
  assert.equal(items.length, 1);
  assert.equal(sampleSubtotal(items), 280000);
});
test("subtotal is exactly the sample sum without invented fees", () => {
  assert.equal(sampleSubtotal(products), 660000);
  assert.equal(sampleSubtotal([]), 0);
});
