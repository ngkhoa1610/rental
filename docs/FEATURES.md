# Feature & URL catalog

Updated **2026-09-20**. Customer preview only; no backend or real booking. Local origin: `http://localhost:3000`.

## Business routes

| Feature     | URL                | Behavior / state                                                                                           | Main owner                                 |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Landing     | `/`                | Hero, benefits, rental process, FAQ, sample looks; section actions scroll/focus locally                    | `src/app/page.tsx`                         |
| Catalog     | `/products`        | Local search/filter/sort, Apply, chips, one Clear, grid or empty state                                     | `src/components/store/catalog.tsx`         |
| Collections | `/collections`     | Three editorial collections; View product opens the illustrated product                                    | `src/app/(store)/collections/page.tsx`     |
| Lookbook    | `/lookbook`        | Three occasion guides, styling notes, local scroll/focus shortcuts and one featured-product link per guide | `src/app/(store)/lookbook/page.tsx`        |
| Product     | `/products/[slug]` | Gallery Sheet, sample price, facts, occasion tags, fit/care disclosures, save/add, related products        | `src/app/(store)/products/[slug]/page.tsx` |
| Wishlist    | `/wishlist`        | Restore/loading, saved list or empty; unsave and focus recovery locally                                    | `src/components/store/saved-looks.tsx`     |
| Rental bag  | `/cart`            | Restore/loading, selected looks, sample subtotal, remove/save, clear-confirm/cancel and help               | `src/components/store/rental-bag.tsx`      |

Slugs: `muse-dress`, `luna-set`, `soleil-top`. Unknown product/page returns branded 404. `/search` was removed and returns 404. Loading/error/retry boundaries are UI states, not new business destinations.

## Feedback wall — `/feedback`

Business page for outfit stories, accessible through the desktop/mobile navigation and footer. Compact two-column grid with large typography, alternating pastel/dark cards and existing styling photos; mobile uses one column. No row spans, forced empty cells or visual reordering. Six stories are explicitly illustrative.

- Write name, 1–5 rating and a 10–500 character story in a Sheet. Validation and a private preview stay in the page. Nothing is published or sent automatically.
- Share an individual sample or private preview using the native device menu; otherwise copy text. A manual selectable field handles unavailable/denied clipboard. Cancellation does not copy or report delivery. Labels remain in shared content.
- Draft/preview are transient component state and clear on unmount/reload. No localStorage or API. No verified-review badges, aggregate ratings or public review IDs/URLs.
- Full ownership, states, tests and limitations: `feedback-wall.md`.

## Lookbook — `/lookbook`

A styling guide rather than another product listing: Date night, Vacation and Weekend stories explain pairings, finishing touches and ways to adapt an outfit. Occasion buttons scroll/focus the corresponding heading without changing URL/history. Each story links to its exact featured product, derives sample name/price/duration from catalog, and explains that suggested accessories are not included. All guides render without JavaScript; shortcuts require JavaScript. No filters, account state or API. See `lookbook-guide.md`.

## Catalog interaction contract

| Local field | Values / behavior                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Search      | Trimmed, max 120 characters; case-insensitive AND match of words in name/category/collection/occasion |
| Category    | Dresses, Sets, Tops, Outerwear; Outerwear currently empty                                             |
| Occasion    | Date night, Wedding guest, Party, Vacation, Weekend                                                   |
| Collection  | The Occasion Edit, Weekend Edit, Everyday Edit                                                        |
| Sort        | Featured, numeric price ascending/descending; unknown value defaults to featured                      |

Search stays visible. Advanced filters disclose in place. Editing updates the draft and hint; Apply updates results. Remove-chip preserves other **applied** filters and synchronizes the draft; Clear resets both and is shown only when filters are applied. Empty state does not duplicate reset. Normalization also caps category/occasion/collection strings at 80 characters.

These fields never become URLs, query parameters, routes or history entries. The old URL helpers and Next Form router submission are removed. Legacy query parameters on `/products` are ignored. Catalog remount/reload starts from the default unfiltered state; Back/Forward operates on business navigation only. No filter storage/provider is added.

## Shared features and boundaries

| Feature         | Behavior                                                                                                                         | Source / tests                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Navigation      | Active business links; mobile Sheet with Escape/focus restoration; no search/FAQ route shortcuts                                 | `layout/site-header.tsx`; DOM and HTTP tests                                 |
| Section actions | Button scroll/focus, respects reduced motion, no hash/history write; a11y skip-link exception                                    | `ui/section-button.tsx`; DOM test                                            |
| Selection       | Local save/unsave/add/remove; idempotent bag add; clear Sheet; status/dismiss feedback; no automatic navigation                  | `store/selection-actions.tsx`, `store/rental-bag.tsx`; DOM tests             |
| Storage         | Versioned sanitized slug arrays, no PII/tokens/prices; restore before actions; blocked/quota fallback; cross-tab last-write-wins | `lib/rental-selection.ts`, React adapter; pure and DOM tests                 |
| Images          | Three local sakura outfit images, shared consistently across editorial/card/detail; fallback when load fails                     | `public/images/`, `ui/fashion-image.tsx`; HTTP/DOM tests; `image-sources.md` |
| Motion          | Subtle one-time reveal; above-fold/no-JS visible; reduced-motion and keyboard reveal                                             | `ui/scroll-reveal.tsx`; DOM enhancement tests                                |
| Recovery        | Loading shell, empty/no-match, unknown slug/page 404, root error retry without raw server detail                                 | `src/app/`; build/HTTP and DOM tests                                         |

## Verification and limits

Current results: `feedback-motion-review.md`; mandatory matrix: `QA.md`. Layout is accepted by the user. DOM assertions do not prove responsive rendering, hydration, image crops or browser console behavior.

Sample photos/prices are not confirmed inventory. No availability, rental schedule, order, account, checkout/payment, admin or backend/database. Local selection is a preference, not a reservation. Existing components preserve sample/indicative labels; no fake business form or policy is added.
