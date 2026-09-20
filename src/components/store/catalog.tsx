"use client";

import { useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/page-heading";
import { ProductCard } from "@/components/store/product-card";
import {
  activeCatalogFilters,
  categories,
  collections,
  emptyCatalogFilters,
  filterProducts,
  normalizeCatalogFilters,
  occasions,
  products,
  sortOptions,
  type CatalogFilters,
} from "@/lib/catalog";

const filterFields = [
  {
    name: "category",
    label: "Category",
    options: categories,
    emptyLabel: "All categories",
  },
  {
    name: "occasion",
    label: "Occasion",
    options: occasions,
    emptyLabel: "Every occasion",
  },
  {
    name: "collection",
    label: "Collection",
    options: collections.map(({ name }) => name),
    emptyLabel: "All collections",
  },
] as const;

/** Search, draft filters, applied chips and results share one local owner. */
export function Catalog() {
  const [draft, setDraft] =
    useState<Record<keyof CatalogFilters, string>>(emptyCatalogFilters);
  const [filters, setFilters] = useState(emptyCatalogFilters);
  const applyButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const activeFilters = activeCatalogFilters(filters);
  const results = filterProducts(products, filters);
  const advancedCount = activeFilters.filter(
    ({ key }) => key !== "query",
  ).length;
  const edited = Object.entries(draft).some(
    ([key, value]) => value !== filters[key as keyof CatalogFilters],
  );

  function updateDraft(key: keyof CatalogFilters, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(next: CatalogFilters) {
    setFilters(next);
    setDraft(next);
  }

  return (
    <>
      <form
        className="store-filter-form"
        aria-label="Find looks"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters(normalizeCatalogFilters(draft));
        }}
      >
        <div className="store-search-row">
          <div className="store-search-field">
            <label htmlFor="catalog-query">Search looks</label>
            <div>
              <Search aria-hidden="true" />
              <input
                ref={searchInput}
                id="catalog-query"
                type="search"
                value={draft.query}
                onChange={(event) => updateDraft("query", event.target.value)}
                maxLength={120}
                placeholder="Try Muse or wedding guest"
                autoComplete="off"
              />
            </div>
          </div>
          <Button ref={applyButton} type="submit" className="home-cta">
            Apply filters
          </Button>
        </div>
        <details className="store-filter-disclosure">
          <summary>
            <SlidersHorizontal aria-hidden="true" /> Filters & sort
            {advancedCount > 0 && (
              <span className="store-filter-count">{advancedCount} active</span>
            )}
          </summary>
          <div className="store-filter-grid">
            {filterFields.map(({ name, label, options, emptyLabel }) => (
              <label key={name}>
                {label}
                <select
                  value={draft[name]}
                  onChange={(event) => updateDraft(name, event.target.value)}
                >
                  <option value="">{emptyLabel}</option>
                  {options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Sort by
              <select
                value={draft.sort}
                onChange={(event) => updateDraft("sort", event.target.value)}
              >
                {sortOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>
        <p className="store-filter-hint" role="status" aria-live="polite">
          {edited
            ? "Filters changed. Apply to update your results."
            : "Find a look by name, collection or occasion."}
        </p>
      </form>
      {activeFilters.length > 0 && (
        <div className="store-active-filters" aria-label="Applied filters">
          <ul>
            {activeFilters.map(({ key, label, value }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-label={`Remove ${label}: ${value}`}
                  onClick={() => {
                    applyFilters({
                      ...filters,
                      [key]: emptyCatalogFilters[key],
                    });
                    applyButton.current?.focus();
                  }}
                >
                  <span>
                    {label}: {value}
                  </span>
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="store-text-link"
            onClick={() => {
              applyFilters(emptyCatalogFilters);
              searchInput.current?.focus();
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="store-results-heading">
        <p role="status">
          {results.length} {results.length === 1 ? "look" : "looks"}
          {filters.query ? ` for “${filters.query}”` : " to explore"}
        </p>
        <span>Sample wardrobe · indicative prices</span>
      </div>
      {results.length ? (
        <div className="store-product-grid">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title="No looks match just yet." showAction={false}>
          Try another word or remove an applied filter above to explore the
          collection.
        </EmptyState>
      )}
    </>
  );
}
