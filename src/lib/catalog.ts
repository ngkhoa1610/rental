/** Temporary presentation data, never a source of inventory or availability. */
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

export const products: readonly Product[] = [
  {
    slug: "muse-dress",
    name: "Muse Dress",
    category: "Dresses",
    collection: "The Occasion Edit",
    occasions: ["Date night", "Wedding guest", "Party"],
    price: 280000,
    rentalDays: 3,
    image: "/images/sakura-muse-dress.png",
    imageAlt:
      "Blush pink midi dress beneath cherry blossoms — generated styling image",
    description:
      "An occasion-led look for celebrations and evenings worth dressing up for. Explore the silhouette, then keep it in your rental bag while you make plans.",
  },
  {
    slug: "luna-set",
    name: "Luna Set",
    category: "Sets",
    collection: "Weekend Edit",
    occasions: ["Weekend", "Vacation"],
    price: 220000,
    rentalDays: 3,
    image: "/images/sakura-luna-set.png",
    imageAlt: "Powder pink blazer and trouser set — generated styling image",
    description:
      "A coordinated look for slow weekends and days away. A starting point for finding an outfit that feels effortless from the first plan to the last.",
  },
  {
    slug: "soleil-top",
    name: "Soleil Top",
    category: "Tops",
    collection: "Everyday Edit",
    occasions: ["Date night", "Weekend"],
    price: 160000,
    rentalDays: 3,
    image: "/images/sakura-soleil-top.png",
    imageAlt: "Blush pink blouse with ivory trousers — generated styling image",
    description:
      "A fresh direction for an everyday outfit. Build your own combination around a piece you can imagine wearing beyond a single occasion.",
  },
];

export const collections = [
  {
    name: "The Occasion Edit",
    title: "For the invitation.",
    description: "Date nights, wedding invitations and reasons to celebrate.",
    productSlug: "muse-dress",
  },
  {
    name: "Weekend Edit",
    title: "Leave room for plans.",
    description: "A change of scenery. A different way to get dressed.",
    productSlug: "luna-set",
  },
  {
    name: "Everyday Edit",
    title: "Make the ordinary yours.",
    description: "Small wardrobe changes for the moments in between.",
    productSlug: "soleil-top",
  },
] as const;

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

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
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
