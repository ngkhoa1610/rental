import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeading } from "@/components/store/page-heading";
import { ProductCard } from "@/components/store/product-card";
import {
  categories,
  collections,
  occasions,
  products,
  filterProducts,
  sortOptions,
  type CatalogFilters,
} from "@/lib/catalog";

export function CatalogView({
  filters,
  search = false,
}: {
  filters: CatalogFilters;
  search?: boolean;
}) {
  const results = filterProducts(products, filters);
  const action = search ? "/search" : "/products";

  return (
    <>
      <PageHeading
        title={search ? "Find your next look." : "A look for every plan."}
        description={
          search
            ? "Search by name, occasion or collection."
            : "Explore the sample wardrobe. Save a favourite, or start a rental bag."
        }
        eyebrow={search ? "Search the wardrobe" : "Explore looks"}
      />
      <Form
        action={action}
        className="store-filter-form"
        key={JSON.stringify(filters)}
      >
        <div className="store-search-field">
          <label htmlFor="catalog-query">Search looks</label>
          <div>
            <Search aria-hidden="true" />
            <input
              id="catalog-query"
              type="search"
              name="q"
              defaultValue={filters.query}
              maxLength={120}
              placeholder="Try Muse or wedding guest"
            />
          </div>
        </div>
        <div className="store-filter-grid">
          <label>
            Category
            <select name="category" defaultValue={filters.category}>
              <option value="">All categories</option>
              {categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
              {filters.category &&
                !categories.some((item) => item === filters.category) && (
                  <option value={filters.category}>Unknown category</option>
                )}
            </select>
          </label>
          <label>
            Occasion
            <select name="occasion" defaultValue={filters.occasion}>
              <option value="">Every occasion</option>
              {occasions.map((value) => (
                <option key={value}>{value}</option>
              ))}
              {filters.occasion &&
                !occasions.some((item) => item === filters.occasion) && (
                  <option value={filters.occasion}>Unknown occasion</option>
                )}
            </select>
          </label>
          <label>
            Collection
            <select name="collection" defaultValue={filters.collection}>
              <option value="">All collections</option>
              {collections.map(({ name }) => (
                <option key={name}>{name}</option>
              ))}
              {filters.collection &&
                !collections.some(
                  (item) => item.name === filters.collection,
                ) && (
                  <option value={filters.collection}>Unknown collection</option>
                )}
            </select>
          </label>
          <label>
            Sort by
            <select name="sort" defaultValue={filters.sort}>
              {sortOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="store-filter-actions">
          <Button type="submit" className="home-cta">
            {search ? "Search looks" : "Apply filters"}
          </Button>
          <Link href={action} className="store-text-link">
            Clear filters
          </Link>
        </div>
      </Form>
      <div className="store-results-heading">
        <p role="status">
          {results.length} {results.length === 1 ? "look" : "looks"}
          {filters.query ? ` for “${filters.query}”` : " to explore"}
        </p>
        <span>Sample collection · indicative prices</span>
      </div>
      {results.length ? (
        <div className="store-product-grid">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No looks match just yet."
          href={action}
          label="Reset filters"
        >
          Try another word or remove a filter to explore the sample collection.
        </EmptyState>
      )}
    </>
  );
}
