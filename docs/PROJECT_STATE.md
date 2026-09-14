# Rental Store — current project state

Latest docs checkpoint: **2026-09-14 / Changed-files delivery and naming rules**.
Application code checkpoint: **2026-09-10 / Local selections, product details & gentle scroll motion**
Source artifact: **rental-main.zip** in the project's rental folder.
Previous checkpoint: 2026-09-09 landing-page refactor, documented in `IMPLEMENTATION-REVIEW.md`.

## Latest user decisions

- Landing UI is provisionally accepted; keep its visual direction.
- Continue other customer UI pages within the fashion-rental app's scope.
- Frontend/Next.js code must be clean, readable and maintainable.
- Run build, lint and code tests after implementation.
- Persist the latest source and workflow for subsequent work.
- On every source receipt and completed implementation update project memory, source and concise feature/URL docs.
- Formatting, security and browser UI testing are standing requirements after code changes. Avoid redundant same-page navigation and duplicate actions.

Start with `PROJECT_MEMORY.md`; see `WORKFLOW.md`, `FEATURES.md` and `QA.md` for the current contract.

The earlier handoffs restricted their own phase to the landing page. This request authorizes the next UI phase. It does not define new business policies or authorize inventing live backend behavior.

## Implemented routes

| Route | Behavior |
|---|---|
| `/` | Accepted landing composition; explore and sample-product links now open the real UI pages |
| `/products` | Sample product grid; URL-based text/category/occasion/collection filters and numeric price sort |
| `/search` | Same reusable catalog surface, tailored to searching; no-match and reset states |
| `/collections` | Three editorial collection sections linked to filtered catalog results |
| `/lookbook` | Three editorial inspiration stories linked to occasion filters |
| `/products/muse-dress` | Detail, sample price, unknown-policy disclosure, wishlist and bag actions |
| `/products/luna-set` | Same reusable detail route |
| `/products/soleil-top` | Same reusable detail route |
| `/products/[unknown]` | 404; no invented product |
| `/wishlist` | Saved sample looks; remove via heart; empty state |
| `/cart` | Selected looks, remove/clear/save, sample-price subtotal, explicit no-booking state |

Header, footer and mobile Sheet navigate across pages. Mobile tabs show the active destination. Search uses Next Form so submissions preserve the root selection provider during client navigation. The mobile bottom bar retains safe-area spacing.

## Data and state

`src/lib/catalog.ts` is the only product source: three existing sample looks, their previously shown prices and three-day examples. It includes temporary presentation-only categories/occasions and descriptions. It is not verified inventory.

- Muse Dress: 280,000 VND / 3-day example.
- Luna Set: 220,000 VND / 3-day example.
- Soleil Top: 160,000 VND / 3-day example.
- Outerwear has no sample record and produces a genuine empty result.
- Photography is reused from previously supplied source URLs, marked as inspiration.
- Sizing, measurements, rental dates, availability, delivery/return terms and charges remain unconfirmed.

`SelectionProvider` uses a per-provider external store with React Context and `useSyncExternalStore`. It restores versioned localStorage (`rental-store.selection.v1`) after hydration, before enabling mutations. Only wishlist/bag product slugs are saved; prices and product facts always come from the current catalog. Corrupt/unsupported data, removed IDs and duplicates are handled safely. Storage access/quota errors preserve in-memory actions and show a warning. Storage events update other tabs on the same origin; simultaneous writes use last-write-wins semantics. This is device-local preference storage, not account sync or an order. Clearing browser data removes it.

The bag subtotal is the sum of displayed example prices, not a rental quotation. No taxes, deposits, delivery charges, availability calculations or rental-period pricing have been invented.

## Architecture and file map

| Area | Location / rule |
|---|---|
| Existing global layout | `src/app/layout.tsx`, root selection provider only |
| Customer route shell | `src/app/(store)/layout.tsx`, shared header/footer and route CSS |
| Customer pages | `src/app/(store)/…`, default Server Components |
| Shared presentation | `src/components/store/catalog-view.tsx`, `product-card.tsx`, `page-heading.tsx` |
| Client interactions | `selection-provider.tsx`, `selection-actions.tsx`, `saved-looks.tsx`, `rental-bag.tsx`, `product-gallery.tsx` |
| Sample data / filtering | `src/lib/catalog.ts` |
| Pure selection logic | `src/lib/rental-selection.ts` |
| Shared navigation | `src/components/layout/…` |
| Customer styles | `src/app/(store)/store.css`, `store-*` namespace |
| Tests | `tests/catalog.test.mjs`, `tests/rental-selection.test.mjs`, `tests/selection-storage.test.mjs`, `scripts/smoke-test.mjs` |
| Development agreement | `AGENTS.md`, `docs/WORKFLOW.md` |

No runtime/dev dependency versions changed. `package.json` adds only `test`, `test:smoke` and `check` scripts. A transient pinned Prettier formatter was used on touched code; it is not a project dependency.

## Verification checkpoint

Final verification is recorded after running the complete `npm run check` pipeline. See the appended result below.

Covered checks:

- Catalog: case-insensitive multiword matching, combined filters, empty/invalid filters, repeated and long query parameters, stable numeric sorting and unknown slugs.
- Selection: toggle, add without duplicates, remove, clear without affecting wishlist, invalid IDs, immutability and exact sample subtotal.
- Production HTTP: ten valid pages, combined filter, empty search, escaped input and unknown-product 404.

Not verified: browser visual comparison, desktop/mobile DOM interactions, keyboard-focus behavior in a live browser, browser Back/Forward interaction, image cropping and hydration behavior under browser automation. Unit tests validate the reducer; HTTP tests do not simulate button clicks.

## Next steps / boundaries

1. Complete mandatory desktop/mobile browser interaction QA in a compatible environment; establish reproducible format/security checks.
2. Confirm actual product records, sizing and image assets before inventory integration.
3. Define rental dates/duration, availability, delivery/return, deposit/payment rules before checkout or booking work.
4. Define auth/account, order history and admin scope separately.

Do not treat the remaining items as already implemented. Begin future work by reading this file, `AGENTS.md` and `docs/WORKFLOW.md`, then load the latest source version rather than the original upload.

## Final result — 2026-09-10

`npm run check` completed with exit code **0** on the final formatted application source:

| Gate | Result |
|---|---|
| ESLint | Passed |
| Unit tests | 30 passed, 0 failed |
| Production build | Passed; compilation, TypeScript and static generation completed |
| Production HTTP smoke tests | 14 passed, including unknown-product HTTP 404 |

Browser preview was attempted but could not start: the supervised preview forwards `--host` and `--strictPort`, which this Next.js CLI does not support. The bounded attempts were stopped and no browser page was opened. No browser/E2E or screenshot verification was performed. Node's unit runner reports a non-failing ESM auto-detection warning because the existing package does not declare a module type; package semantics were preserved. Dependency versions and lockfile are unchanged.


## Latest implementation details

- User accepted the proposed initial FE improvements and explicitly requested subtle scroll animations.
- Wishlist/bag now restore on refresh. Loading placeholders avoid claiming the selection is empty before restoration. Controls wait until restoration is ready, preventing an early click from overwriting stored data.
- Product details offer a full-image Sheet using the existing Radix primitive. The single supplied image remains the only view; no fake gallery thumbnails or alternate angles were created.
- Fit/measurement and material/care disclosures explain what is available and what is still unconfirmed. No product sizes, measurements or material composition were invented.
- Existing ScrollReveal now fades/translates below-the-fold content once, typically 12px over 600ms; distance is capped at 20px and stagger at 160ms. It skips above-the-fold content, supports reduced motion including preference changes, and exposes content immediately on keyboard focus. Without JavaScript the content remains visible.
- Motion is used on existing landing sections, product cards, collection/lookbook copy and the related-look area. No animation library was introduced.
- HTTP tests for wishlist/cart now verify their server page shells; client-restored selections are covered by store tests, not by HTTP tests.

## Browser QA blocker and remaining work

The requested desktop/mobile review is **not completed**. The compatible preview path is currently blocked before the app starts; this is an environment/Next.js CLI mismatch, not an observed UI regression. Framework, dev script and configuration were preserved. The preview was stopped after bounded attempts.

At the next compatible browser session, check:

1. 320/390px, 768px and 1440px layouts; menu, filters and Back/Forward.
2. Save to wishlist/bag, refresh, remove/clear, refresh again; cross-tab changes.
3. Open full image, Escape dismissal, focus return and mobile image fit.
4. Scroll entrances, large sections, keyboard focus below the fold, reduced motion and no-JavaScript rendering.
5. Image loading/crops and browser console/hydration errors.

The latest `npm run check` passed all four gates (lint, 30 unit tests, build, 14 production HTTP checks). Unit storage tests cover a recreated store instance to model refresh, not a live browser reload. Do not claim browser acceptance until it is actually tested.


## Documentation checkpoint — 2026-09-13

Reviewed saved ZIP version 3 against working source: all 57 files matched before edits. Updated AGENTS/WORKFLOW/README and added PROJECT_MEMORY, FEATURES and QA. Application source, dependencies and executable tests are unchanged; the app results above are historical, not rerun for this docs-only checkpoint.

Missing automated format/security/browser gates and potentially redundant Explore links/reset controls are follow-up work, not silently fixed or marked verified. The previous preview blocker describes the historical environment; future QA should use the compatible browser workflow available then.

Docs validation passed: seven changed/new documentation files, all eight route patterns documented, referenced local paths and README links resolve, documented npm scripts exist, Markdown fences/whitespace are consistent, and the generated Next.js agent block is preserved. Byte comparison confirmed no application/config/dependency/test changes.


## Documentation checkpoint — 2026-09-14

User requires changed-files-only output and meaningful, consistent naming. Updated AGENTS, WORKFLOW, PROJECT_MEMORY and this state log. Internal full source remains the resume checkpoint; user delivery contains only changed files, preserving project-relative paths. Naming and deletion/rename handoff rules are in WORKFLOW section 7.

Baseline: full source version 4, 60/60 files matched before edits. This is docs-only; application files/config/tests/dependencies remain byte-identical. No new application test run is claimed.
