# Rental Store

Next.js fashion-rental UI with a warm landing page and customer discovery/selection pages.

Start with [project state](docs/PROJECT_STATE.md), [working process](docs/WORKFLOW.md) and [frontend rules](AGENTS.md).

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

This runs ESLint, unit tests, a production build and production HTTP smoke tests. Smoke tests start and stop their own temporary server. They are not browser/E2E tests.

Individual commands:

```bash
npm run lint
npm test
npm run build
npm run test:smoke
```

## Pages

`/`, `/products`, `/products/[slug]`, `/search`, `/collections`, `/lookbook`, `/wishlist`, `/cart`.

## Preview boundary

All products, prices and photos are sample presentation content. Bag/wishlist preferences use versioned localStorage, with an in-memory fallback if storage is blocked. No item is reserved and no order is placed. Checkout, payment, accounts, availability and backend are not implemented.

Keep sample data in `src/lib/catalog.ts`, selection logic in `src/lib/rental-selection.ts`, shared UI in `src/components/store`, and route composition in `src/app/(store)`.

The repository retains Next.js 16.3.4, React 19.2.8, TypeScript strict mode, Tailwind 4, shadcn/Radix and Lucide. No additional runtime libraries were introduced for this UI phase.
