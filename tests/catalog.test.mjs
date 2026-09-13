import assert from "node:assert/strict";
import { test } from "node:test";
import {
  products,
  getProduct,
  filterProducts,
  parseCatalogFilters,
  formatPrice,
} from "../src/lib/catalog.ts";

const search = (params) =>
  filterProducts(products, parseCatalogFilters(params));

test("catalog has unique route slugs and positive sample prices", () => {
  assert.equal(
    new Set(products.map((item) => item.slug)).size,
    products.length,
  );
  assert.ok(products.every((item) => item.price > 0 && item.rentalDays > 0));
});
test("blank query returns the original featured order", () => {
  assert.deepEqual(search({ q: "   " }), products);
});
test("search is case insensitive and matches multiple words", () => {
  assert.deepEqual(
    search({ q: "  WEDDING  guest " }).map((item) => item.slug),
    ["muse-dress"],
  );
});
test("search matches collection and category as well as names", () => {
  assert.equal(search({ q: "Everyday Edit" })[0].slug, "soleil-top");
  assert.equal(search({ q: "Sets" })[0].slug, "luna-set");
});
test("all filters combine rather than widening results", () => {
  assert.equal(
    search({
      category: "Sets",
      occasion: "Vacation",
      collection: "Weekend Edit",
    }).length,
    1,
  );
  assert.equal(
    search({ category: "Sets", occasion: "Wedding guest" }).length,
    0,
  );
});
test("unknown filters and empty categories do not fabricate products", () => {
  assert.equal(search({ category: "Outerwear" }).length, 0);
  assert.equal(search({ collection: "not-real" }).length, 0);
  assert.equal(search({ q: "nothing-matches" }).length, 0);
});
test("repeated parameters choose the first value and long queries are bounded", () => {
  assert.equal(parseCatalogFilters({ q: ["Muse", "Luna"] }).query, "Muse");
  assert.equal(parseCatalogFilters({ q: "a".repeat(200) }).query.length, 120);
  assert.equal(parseCatalogFilters({ category: [] }).category, "");
});
test("sorting uses numeric prices and never mutates source order", () => {
  const original = products.map((item) => item.slug);
  assert.deepEqual(
    search({ sort: "price-asc" }).map((item) => item.price),
    [160000, 220000, 280000],
  );
  assert.deepEqual(
    search({ sort: "price-desc" }).map((item) => item.price),
    [280000, 220000, 160000],
  );
  assert.deepEqual(
    products.map((item) => item.slug),
    original,
  );
});
test("invalid sort safely falls back to featured", () => {
  assert.equal(parseCatalogFilters({ sort: "__proto__" }).sort, "featured");
});
test("unknown slugs return undefined for route-level notFound handling", () => {
  assert.equal(getProduct("missing"), undefined);
  assert.equal(getProduct("muse-dress")?.name, "Muse Dress");
});
test("VND formatting displays integer sample prices", () => {
  assert.match(formatPrice(280000), /280\.000/);
  assert.match(formatPrice(280000), /₫/);
});
