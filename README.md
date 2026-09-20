# Rental Store

Next.js fashion-rental UI with a sakura/pastel pink landing page and customer discovery/selection pages.

Start with [project memory](docs/PROJECT_MEMORY.md), [features and URLs](docs/FEATURES.md), [quality gates](docs/QA.md), [project state](docs/PROJECT_STATE.md), [working process](docs/WORKFLOW.md) and [frontend rules](AGENTS.md).

## Run locally

Use Node.js **22.18 or later** for the TypeScript unit-test runner. The verified environment uses Node.js **24.19.0**.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Wishlist and rental-bag selections are saved on this device and restored after refresh. Browser storage must be available. These are local preferences, not reservations or orders.

## Verify

```bash
npm run check
```

This runs pinned Prettier checks, ESLint, pure logic and jsdom interaction tests, a production build, production HTTP smoke checks and a dependency audit. Security source review and desktop/mobile browser QA remain separate requirements. jsdom tests do not verify layout, image cropping or browser hydration. See [current review](docs/lookbook-feedback-review.md) for evidence and the blocked browser gate.

```bash
npm run format
npm run format:check
npm run lint
npm test
npm run build
npm run test:smoke
npm run test:security
```

Three generated sakura outfit photos are included locally. [Image sources](docs/image-sources.md) records their provenance and prompts. [Changed-file handoff](docs/lookbook-feedback-handoff.md) lists added/modified/deleted files and apply steps.

## Pages

`/`, `/products`, `/products/[slug]`, `/collections`, `/lookbook`, `/feedback`, `/wishlist`, `/cart`.

Search, filtering and sorting stay within `/products` using local state; no URL/history updates. `/search` is removed. Catalog state resets on remount; wishlist/bag preferences remain independently persisted.

The [lookbook](docs/lookbook-guide.md) explains how to style each featured piece for an occasion; shortcuts scroll and focus within the page. The compact feedback grid has no empty grid slots.

The [feedback wall](docs/feedback-wall.md) uses a playful collage layout and local story preview/share. Examples are labelled; private previews disappear on leaving/reloading and are never posted publicly. Scroll entrances now start earlier with less travel; keyboard and reduced-motion paths appear immediately.

## Preview boundary

All products, prices and photos are sample presentation content. Bag/wishlist preferences use versioned localStorage, with an in-memory fallback if storage is blocked. No item is reserved and no order is placed. Checkout, payment, accounts, availability and backend are not implemented.

Keep sample data in `src/lib/catalog.ts`, selection logic in `src/lib/rental-selection.ts`, shared UI in `src/components/store`, and route composition in `src/app/(store)`.

The repository retains Next.js 16.3.4, React 19.2.8, TypeScript strict mode, Tailwind 4, shadcn/Radix and Lucide. Dependencies and lockfile are unchanged in this update. Private catalog/menu/clear-confirmation helpers now live with their owning features.
