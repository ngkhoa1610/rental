import assert from "node:assert/strict";
import fixtures from "../src/components/layout-preview/fixtures.json" with { type: "json" };

const catalogProducts = Object.freeze(
  fixtures.products.map((product) =>
    Object.freeze({ ...product, occasions: Object.freeze(product.occasions) }),
  ),
);

export const [dress, set, top] = catalogProducts;

export function catalogViewRuntime({ paginate = false } = {}) {
  const extra = paginate
    ? Array.from({ length: 9 }, (_, index) =>
        Object.freeze({
          ...set,
          slug: "outfit-" + (index + 1),
          name: "Trang phục " + (index + 1),
        }),
      )
    : [];
  const products = Object.freeze([...catalogProducts, ...extra]);
  return {
    setCsrf() {},
    api: {
      async call(operation) {
        if (operation === "session.get") {
          return { profile: null, csrfToken: null };
        }
        assert.equal(operation, "catalog.list");
        return products;
      },
    },
  };
}
