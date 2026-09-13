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
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=90",
    imageAlt: "Evening dress photographed for fashion inspiration",
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
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=90",
    imageAlt: "Coordinated fashion look used as temporary styling inspiration",
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
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=90",
    imageAlt: "Clothing on a rail used as temporary wardrobe inspiration",
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

export type SearchParams = Record<string, string | string[] | undefined>;
export interface CatalogFilters {
  query: string;
  category: string;
  occasion: string;
  collection: string;
  sort: SortOrder;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseCatalogFilters(params: SearchParams): CatalogFilters {
  const sort = first(params.sort);
  return {
    query: first(params.q).slice(0, 120),
    category: first(params.category),
    occasion: first(params.occasion),
    collection: first(params.collection),
    sort: sortOptions.some((option) => option.value === sort)
      ? (sort as SortOrder)
      : "featured",
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
