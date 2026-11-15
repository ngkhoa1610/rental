import assert from "node:assert/strict";
import { test } from "node:test";
import {
  products,
  getProduct,
  filterProducts,
  normalizeCatalogFilters,
  formatPrice,
} from "../src/lib/catalog.ts";

const search = (params) =>
  filterProducts(products, normalizeCatalogFilters(params));

test("catalog has unique route slugs and positive sample prices", () => {
  assert.equal(products.length, 12);
  assert.equal(
    new Set(products.map((item) => item.slug)).size,
    products.length,
  );
  assert.ok(products.every((item) => item.price > 0 && item.rentalDays > 0));
});
test("blank query returns the original featured order", () => {
  assert.deepEqual(search({ query: "   " }), products);
});
test("search is case insensitive and matches multiple words", () => {
  assert.ok(
    search({ query: "  WEDDING  guest " }).some(
      (item) => item.slug === "muse-dress",
    ),
  );
});
test("search matches collection and category as well as names", () => {
  assert.equal(search({ query: "Everyday Edit" })[0].slug, "soleil-top");
  assert.equal(search({ query: "Sets" })[0].slug, "luna-set");
});
test("all filters combine rather than widening results", () => {
  assert.equal(
    search({
      category: "Sets",
      occasion: "Vacation",
      collection: "Weekend Edit",
    }).length,
    2,
  );
  assert.equal(
    search({ category: "Sets", occasion: "Wedding guest" }).length,
    0,
  );
});
test("unknown filters and empty categories do not fabricate products", () => {
  assert.equal(search({ category: "Jewelry" }).length, 0);
  assert.equal(search({ collection: "not-real" }).length, 0);
  assert.equal(search({ query: "nothing-matches" }).length, 0);
});
test("local filter values are trimmed and bounded", () => {
  assert.equal(normalizeCatalogFilters({ query: "  Muse  " }).query, "Muse");
  assert.equal(
    normalizeCatalogFilters({ query: "a".repeat(200) }).query.length,
    120,
  );
  assert.equal(normalizeCatalogFilters({}).category, "");
});
test("sorting uses numeric prices and never mutates source order", () => {
  const original = products.map((item) => item.slug);
  assert.equal(search({ sort: "price-asc" })[0].price, 160000);
  assert.equal(search({ sort: "price-asc" }).at(-1).price, 280000);
  assert.equal(search({ sort: "price-desc" })[0].price, 280000);
  assert.equal(search({ sort: "price-desc" }).at(-1).price, 160000);
  assert.deepEqual(
    products.map((item) => item.slug),
    original,
  );
});
test("invalid sort safely falls back to featured", () => {
  assert.equal(normalizeCatalogFilters({ sort: "__proto__" }).sort, "featured");
});
test("unknown slugs return undefined for route-level notFound handling", () => {
  assert.equal(getProduct("missing"), undefined);
  assert.equal(getProduct("muse-dress")?.name, "Muse Dress");
});
test("VND formatting displays integer sample prices", () => {
  assert.match(formatPrice(280000), /280\.000/);
  assert.match(formatPrice(280000), /₫/);
});

test("applied chips omit empty values and display a readable sort label", async () => {
  const { activeCatalogFilters } = await import("../src/lib/catalog.ts");
  assert.deepEqual(activeCatalogFilters(normalizeCatalogFilters({})), []);
  const chips = activeCatalogFilters(
    normalizeCatalogFilters({ query: '<script>&"', sort: "price-desc" }),
  );
  assert.equal(chips[0].value, '<script>&"');
  assert.equal(chips[1].value, "Price: high to low");
});

test("all free-text filter values are bounded before rendering", () => {
  const filters = normalizeCatalogFilters({
    query: "x".repeat(5000),
    category: "x".repeat(5000),
    occasion: "x".repeat(5000),
    collection: "x".repeat(5000),
  });
  assert.equal(filters.query.length, 120);
  for (const key of ["category", "occasion", "collection"])
    assert.equal(filters[key].length, 80);
});
