"use client";
import { useCatalogData } from "./catalog-data";
import { T, useLanguage } from "@/components/store/language-provider";

import { translate } from "@/lib/language";
import { useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/page-heading";
import { ProductCard } from "@/components/store/product-card";
import {
  activeCatalogFilters,
  categories,
  emptyCatalogFilters,
  filterProducts,
  normalizeCatalogFilters,
  occasions,
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
    options: [],
    emptyLabel: "All collections",
  },
] as const;

/** Search, draft filters, applied chips and results share one local owner. */
export function Catalog() {
  const { t } = useLanguage();
  const { products } = useCatalogData();
  const [draft, setDraft] =
    useState<Record<keyof CatalogFilters, string>>(emptyCatalogFilters);
  const [filters, setFilters] = useState(emptyCatalogFilters);
  const applyButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const activeFilters = activeCatalogFilters(filters);
  // Keep data/filter values stable across languages, and search both vocabularies.
  const normalizeSearch = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  const queryWords = normalizeSearch(filters.query)
    .split(/\s+/)
    .filter(Boolean);
  const results = filterProducts(products, { ...filters, query: "" }).filter(
    (product) => {
      const terms = [
        product.name,
        product.description,
        product.category,
        product.collection,
        ...product.occasions,
      ];
      const searchText = normalizeSearch(
        terms.flatMap((term) => [term, translate("vi", term)]).join(" "),
      );
      return queryWords.every((word) => searchText.includes(word));
    },
  );
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
        aria-label={t("Find looks")}
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters(normalizeCatalogFilters(draft));
        }}
      >
        <div className="store-search-row">
          <div className="store-search-field">
            <label htmlFor="catalog-query">
              <T>{"Search looks"}</T>
            </label>
            <div>
              <Search aria-hidden="true" />
              <input
                ref={searchInput}
                id="catalog-query"
                type="search"
                value={draft.query}
                onChange={(event) => updateDraft("query", event.target.value)}
                maxLength={120}
                placeholder={t("Try Muse or wedding guest")}
                autoComplete="off"
              />
            </div>
          </div>
          <Button ref={applyButton} type="submit" className="home-cta">
            <T>{"Apply filters"}</T>
          </Button>
        </div>
        <details className="store-filter-disclosure">
          <summary>
            <SlidersHorizontal aria-hidden="true" />
            <T>{"Filters & sort"}</T>
            {advancedCount > 0 && (
              <span className="store-filter-count">
                {advancedCount}
                <T>{" active"}</T>
              </span>
            )}
          </summary>
          <div className="store-filter-grid">
            {filterFields.map(({ name, label, options, emptyLabel }) => (
              <label key={name}>
                <T>{label}</T>
                <select
                  aria-label={t(label)}
                  value={draft[name]}
                  onChange={(event) => updateDraft(name, event.target.value)}
                >
                  <option value="">
                    <T>{emptyLabel}</T>
                  </option>
                  {(name === "collection"
                    ? [...new Set(products.map((p) => p.collection))]
                    : options
                  ).map((option) => (
                    <option key={option} value={option}>
                      <T>{option}</T>
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              <T>{"Sort by"}</T>
              <select
                value={draft.sort}
                onChange={(event) => updateDraft("sort", event.target.value)}
              >
                {sortOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    <T>{label}</T>
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>
        <p className="store-filter-hint" role="status" aria-live="polite">
          <T>
            {edited
              ? "Filters changed. Apply to update your results."
              : "Find a look by name, collection or occasion."}
          </T>
        </p>
      </form>
      {activeFilters.length > 0 && (
        <div className="store-active-filters" aria-label={t("Applied filters")}>
          <ul>
            {activeFilters.map(({ key, label, value }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-label={t("Remove {label}: {value}", {
                    label: t(label),
                    value: key === "query" ? value : t(value),
                  })}
                  onClick={() => {
                    applyFilters({
                      ...filters,
                      [key]: emptyCatalogFilters[key],
                    });
                    applyButton.current?.focus();
                  }}
                >
                  <span>
                    <T>{label}</T>: {key === "query" ? value : t(value)}
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
            <T>{"Clear filters"}</T>
          </button>
        </div>
      )}
      <div className="store-results-heading">
        <p role="status">
          {results.length} <T>{results.length === 1 ? "look" : "looks"}</T>
          {filters.query
            ? t(" for “{query}”", { query: filters.query })
            : t(" to explore")}
        </p>
        <span>
          <T>
            {process.env.NEXT_PUBLIC_RENTAL_API_MODE === "http"
              ? "Published wardrobe · check dates"
              : "Sample wardrobe · indicative prices"}
          </T>
        </span>
      </div>
      {results.length ? (
        <div className="store-product-grid">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title={t("No looks match just yet.")} showAction={false}>
          <T>
            {
              "Try another word or remove an applied filter above to explore the collection."
            }
          </T>
        </EmptyState>
      )}
    </>
  );
}
