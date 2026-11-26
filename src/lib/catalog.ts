export const categories = ["Dresses", "Sets", "Tops", "Outerwear"] as const;
export const occasions = [
  "Date night",
  "Wedding guest",
  "Party",
  "Vacation",
  "Weekend",
] as const;
export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type Category = (typeof categories)[number];
export type Occasion = (typeof occasions)[number];
export type SortOrder = (typeof sortOptions)[number]["value"];
export interface Product {
  readonly slug: string;
  readonly name: string;
  readonly category: Category;
  readonly collection: string;
  readonly occasions: readonly Occasion[];
  readonly price: number;
  readonly rentalDays: number;
  readonly image: string;
  readonly imageAlt: string;
  readonly description: string;
}

export const catalogPageSize = 6;

export interface CatalogFilters {
  query: string;
  category: string;
  occasion: string;
  collection: string;
  sort: SortOrder;
}

export const emptyCatalogFilters: CatalogFilters = {
  query: "",
  category: "",
  occasion: "",
  collection: "",
  sort: "featured",
};

/** Normalize local form values. Feature state is never read from the URL. */
export function normalizeCatalogFilters(
  values: Partial<Record<keyof CatalogFilters, string>>,
): CatalogFilters {
  const sort =
    sortOptions.find((option) => option.value === values.sort)?.value ??
    "featured";
  return {
    query: (values.query ?? "").trim().slice(0, 120),
    category: (values.category ?? "").trim().slice(0, 80),
    occasion: (values.occasion ?? "").trim().slice(0, 80),
    collection: (values.collection ?? "").trim().slice(0, 80),
    sort,
  };
}

export function filterProducts(
  items: readonly Product[],
  filters: CatalogFilters,
): Product[] {
  const words = filters.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter((product) => {
    const text = [
      product.name,
      product.category,
      product.collection,
      ...product.occasions,
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      words.every((word) => text.includes(word)) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.occasion ||
        product.occasions.some((occasion) => occasion === filters.occasion)) &&
      (!filters.collection || product.collection === filters.collection)
    );
  });
  if (filters.sort === "price-asc") matches.sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") matches.sort((a, b) => b.price - a.price);
  return matches;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

const filterLabels = {
  query: "Search",
  category: "Category",
  occasion: "Occasion",
  collection: "Collection",
  sort: "Sort",
} as const;

export function activeCatalogFilters(filters: CatalogFilters) {
  return (Object.keys(filterLabels) as (keyof CatalogFilters)[])
    .filter(
      (key) =>
        Boolean(filters[key]) &&
        !(key === "sort" && filters.sort === "featured"),
    )
    .map((key) => ({
      key,
      label: filterLabels[key],
      value:
        key === "sort"
          ? (sortOptions.find((option) => option.value === filters.sort)
              ?.label ?? filters.sort)
          : filters[key],
    }));
}
