# Rental Store — current project state

Checkpoint: **2026-09-20 / Lookbook role and compact feedback layout**. Baseline: full-source version 8, 84 files matched before edits. Internal checkpoint: `rental-main.zip`; deliver only changed files as listed in `lookbook-feedback-handoff.md`.

## Scope and design

Customer fashion-rental preview: landing, catalog, collections, lookbook, product detail, feedback wall, wishlist and rental bag. The user accepted the UI layout on 2026-09-15. Preserve the 1,200px container, symmetric gutters, grids, breakpoints, image frames and mobile safe areas. This update replaces terracotta with soft sakura pink and dark rose text/actions. Three generated outfit photos replace all six previous image assets; image framing CSS is retained. Editorial sections reuse the matching product image. Provenance and prompts: `image-sources.md`.

Three sample products remain: Muse Dress 280,000 VND, Luna Set 220,000 VND, Soleil Top 160,000 VND, each a three-day price example. No confirmed sizes, inventory, availability, dates, deposits or delivery policies. No backend/database, auth, checkout, payment, orders or admin was added.

## Architecture — ownership rather than extra layers

| Area              | Main source                                                                  | Responsibility                                                           |
| ----------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Route composition | `src/app/page.tsx`, `src/app/(store)/…/page.tsx`                             | Server metadata, business page content; product lookup/notFound          |
| Catalog feature   | `src/components/store/catalog.tsx`                                           | Native local form, draft/applied state, chips, results and focus         |
| Sample catalog    | `src/lib/catalog.ts`                                                         | Product facts, filter normalization, pure filtering/sort, chip labels    |
| Navigation        | `src/components/layout/site-header.tsx`, `site-footer.tsx`                   | Header-owned private menu and active link helpers; business destinations |
| Selection         | `src/lib/rental-selection.ts`, `src/components/store/selection-provider.tsx` | Pure versioned store and React/browser adapter                           |
| Customer actions  | `selection-actions.tsx`, `saved-looks.tsx`, `rental-bag.tsx`                 | Local mutations, notices, clear confirmation, focus recovery             |
| Reusable UI       | `src/components/ui/`                                                         | Primitives, image fallback, reveal and section button                    |
| Recovery          | Root error/not-found and store loading/product not-found                     | Retry, 404, loading shell, escaped error display                         |
| Styles            | `src/app/globals.css`, `src/app/(store)/store.css`                           | Shared theme/layout and scoped customer styles                           |

Removed layers: catalog-form/catalog-view split; query parser/URL builder; separate mobile-nav/nav-link modules; clear-bag-button module; `/search` route. No new state library, barrel exports, routing layer or provider. Pages remain Server Components. Catalog and the small header are cohesive client boundaries; this also makes `/products` statically prerenderable.

## State and data boundaries

- Search/filter/sort/reset/chip changes are local state. Apply commits the draft; chip removal keeps other applied filters and synchronizes the form; Clear resets both. Removing a chip focuses Apply; Clear focuses search. State lasts for the mounted Catalog instance. No URL serialization, query reader, router calls, history mutations or filter persistence. Legacy query parameters are ignored. Removed `/search` returns 404.
- Collections/lookbook links open the exact illustrated product business page. Product occasion tags are static text. Landing section buttons scroll/focus without hash updates and respect reduced motion; FAQ/gallery/help/confirmation open in context. Accessibility skip links retain fragments.
- Selection storage remains `rental-store.selection.v1`: only sanitized wishlist/bag slugs. Restore precedes mutations, stale/duplicate IDs are removed, unavailable storage keeps in-memory actions with feedback. Cross-tab last-write-wins is unchanged. Prices derive from catalog; no reservation/order/account sync.
- Generated images are presentation content, not proof of inventory. They remain within the repository; Next Image handles responsive optimization and FashionImage failure fallback.

## Feedback and motion update

The new `/feedback` page is explicitly authorized to use a playful collage layout: a compact two-column grid, large quotes, styling photos and deliberate hover transforms. The accepted existing layouts and shared gutters are preserved. Feedback-specific styles live at the route, scoped with `feedback-*`.

`feedback-wall.tsx` owns the wall, private composer/card/share helpers and transient state. `lib/feedback.ts` holds six labelled examples, input validation and shared-text formatting. No backend, persistence, state provider or dependency was added. Existing Muse/Luna styling photos are reused; they are not customer photos. Native share falls back to clipboard then selectable text; cancellations stop without silently copying. A successful native promise does not claim delivery to a recipient.

The composer previews one story locally; it does not publish it. Closing preserves the draft while mounted, unmount/reload clears it. Sample and private-preview labels travel with shared text. Input is rendered as escaped text; no review aggregate/verified-customer claims are added. Details and limits: `feedback-wall.md`.

ScrollReveal now starts 64px before entry, defaults to 10px travel and uses separate opacity/transform timing. Keyboard/reduced-motion/fast-scroll skip paths become visible immediately. Initial near-viewport and no-JS content stay visible. Hover is limited to fine pointers; mobile/reduced-motion rules remove card movement.

## Lookbook and feedback layout revision

Lookbook now owns three practical styling guides with local occasion shortcuts, pairing/finishing/personalization notes and the exact product destination. The page remains server-rendered; it reuses SectionButton for client scroll/focus, honors reduced motion, and derives product facts from catalog. No route or state layer was added; existing lookbook image frames and grid remain. See `lookbook-guide.md`.

Feedback uses ordinary equal-width two-column rows, stretched cards, a flex content/footer region and side-by-side photo/quote at 1100px+. At narrower widths images sit above quotes; below 768px cards stack without tilt. Removed row spans, forced final-card placement and negative offsets that caused gaps. Tighter hero/section spacing and smaller tilt keep the expressive treatment within the gutters. Existing composer/share and motion behavior are retained.

Only completed FE changes are recorded here. Backend use cases/features await user approval before being recorded as project scope; no architecture or backend code has been introduced.

## Verification

Commands and actual outcomes: `lookbook-feedback-review.md`. Prior motion results are historical in `feedback-motion-review.md`. Required gates: `QA.md`. Next.js 16.3.4, React 19.2.8, TypeScript strict and dependencies/lockfile are unchanged. UI layout acceptance is a user decision; automated browser regression of changed behavior is tracked separately. No-JS content remains rendered, but local interactive controls require JavaScript.

## History

- 2026-09-20: user accepted prior update; requested smoother scroll and a bold, youthful feedback page. Added local preview/share and labelled sample wall, with no BE/database.

- 2026-09-10: customer pages, persisted preview selection and motion.
- 2026-09-13–14: docs/rules, delta-only delivery, FE polish and quality tooling; full-source version 6.
- 2026-09-15: user accepted layout; requested sakura theme, no feature routes/query navigation and simpler source. This checkpoint implements that new contract and supersedes older query-filter rules.
