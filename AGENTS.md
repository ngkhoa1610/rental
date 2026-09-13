<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rental Store — project working agreement

Read `docs/PROJECT_STATE.md` and `docs/WORKFLOW.md` before making changes.
They record the current source checkpoint, accepted scope and verification history.
The FAO handoffs describe the earlier landing phase; the user's 2026-09-10 request
extends the scope to customer-facing discovery and selection UI.

## Frontend / Next.js rules

- Preserve Next.js 16.3.4, React 19.2.8, TypeScript strict mode, Tailwind 4 and the
  existing shadcn/Radix primitives. Inspect the installed Next.js docs for APIs used.
- Default pages and layouts to Server Components. Add `use client` only at the
  boundary that needs state, event handlers or browser APIs.
- Await route `params` and `searchParams`. Use `notFound()` for unknown records,
  per-route metadata, `next/image` with appropriate `sizes`, and `next/link`.
- Use `next/form` for navigational GET forms so URL filters support sharing,
  back/forward navigation and preservation of the preview selection provider.
- Keep route files focused on composition; place reusable UI in
  `src/components/store` and pure domain helpers in `src/lib`.
- Use `src/lib/catalog.ts` as the single source for sample product names, prices,
  categories and collections. Do not duplicate inventory-like arrays in pages.
- Keep pure selection logic in `src/lib/rental-selection.ts`. React Context is
  sufficient for the current preview; do not add a state management dependency.
- Prefer explicit types, readable names, immutable transforms and small cohesive
  components. Avoid `any`, non-null assertions, nested ternaries and premature abstractions.
- Reuse existing Button/Sheet/etc. Native inputs/selects/details are appropriate
  when there is no installed matching primitive. Do not duplicate UI systems.
- Preserve the accepted warm landing style. Scope customer-page CSS to `store-*`
  classes; put only genuinely shared navigation styles in `globals.css`.
- Keep labels, focus states, keyboard access, meaningful alt text and touch targets.
  Include empty/not-found/loading states where relevant. Honour reduced motion.
- Sample images and prices are not confirmed inventory. Do not invent availability,
  sizes, stock, discounts, deposits, fees, delivery rules, booking or payment APIs.
- Wishlist and preview bag are saved on the device in versioned localStorage.
  Restore before enabling mutations, sanitize stale IDs, and preserve in-memory
  actions if storage is unavailable. Never represent this as account sync, a
  reservation or an order.
- Reuse ScrollReveal for subtle one-time entrances. Do not hide above-the-fold
  content; respect reduced motion, no-JavaScript visibility and keyboard focus.

## Required workflow

1. Read current source, project state and relevant framework docs.
2. State the current problem, bounded scope, affected files and material unknowns.
   Continue already authorized UI work without redundant approval questions.
3. Implement the smallest cohesive change and format touched files readably.
4. Add meaningful tests for changed logic or flows. Do not merely mirror code.
5. Run `npm run check`: lint, unit tests, production build and HTTP smoke tests.
   The test runner requires Node.js 22.18+ (Node.js 24 LTS is the verified runtime).
6. If the user asks for browser testing, test desktop/mobile interactions separately.
   Never call a build or HTTP test visual/E2E verification.
7. Fix defects and rerun affected tests plus any required final gates.
8. Update `docs/PROJECT_STATE.md` and `docs/WORKFLOW.md` when decisions change.
9. Save the complete source archive with full files, excluding dependencies, build
   output and secrets. Update the existing source artifact's version; preserve history.
10. Report changed behavior, checks actually run and remaining limitations. Do not
    claim future backend/checkout/account scope is complete.
