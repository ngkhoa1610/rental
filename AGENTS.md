<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rental Store — project working agreement

Read `docs/PROJECT_MEMORY.md`, `docs/PROJECT_STATE.md` and `docs/WORKFLOW.md` before making changes.
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

The user's 2026-09-13 rules apply to every implementation without another request
for documentation, persistence or browser QA. Follow `docs/WORKFLOW.md` and
`docs/QA.md`; maintain feature/URL coverage in `docs/FEATURES.md`.

1. Resolve the latest source and compare incoming files before replacing local work.
   On every source upload and completed implementation update project memory,
   provenance, decisions, feature docs, verification status and remaining work.
2. State bounded scope and meaningful acceptance criteria. Continue authorized work
   without redundant permission questions; never invent business policies.
3. Implement a cohesive change, meaningful regression coverage for changed logic or
   flows, and explicit formatting checks on touched files.
4. Run `npm run check`: lint, unit, build and production HTTP. Separately perform
   relevant security review/tests and desktop/mobile browser interaction/UI QA.
   This command alone does not satisfy all gates. Use Node.js 22.18+.
5. Fix failures and rerun affected checks and final gates on final code. Record
   PASS / FAIL / BLOCKED / N/A with evidence; never label blocked QA passed.
6. Update feature URLs, interactions, data boundaries and tests in FEATURES;
   implementation state in PROJECT_STATE and the resume index PROJECT_MEMORY.
7. Save complete source/tests/docs to the existing versioned source artifact,
   excluding dependencies, generated output and secrets; preserve history.
   For a future externally Git-backed project, persist through Git instead.
8. Deliver only added/modified files relative to the last delivered or user-supplied
   baseline, retaining project-relative paths and complete file contents. List deleted
   and renamed paths explicitly. Keep the full checkpoint internally; do not attach
   the whole project unless requested. Follow naming rules in WORKFLOW section 7.
9. Report behavior, checks actually run and limitations. Saving blocked work as a
   checkpoint is allowed; declaring it fully verified is not.

Docs-only work may validate documentation and unchanged application fingerprints
without rerunning app gates; label old app test results as historical.

## Interaction and navigation contract

- Buttons perform actions; links intentionally change destinations. Save/remove,
  add-to-bag, gallery, FAQ and same-page details remain in context with feedback.
- Never auto-navigate to wishlist/cart after a mutation; an optional explicit link
  is fine. Closing a Sheet restores focus to its trigger.
- Filter/search/sort can update query on the current route for sharing and
  Back/Forward. Do not route via another page to use a feature already available.
- Avoid duplicate primary actions/reset controls in the same visible region.
  Global navigation may repeat when serving different contexts.
- Never nest interactive controls, use placeholder `href="#"`, reload for local
  actions, or create routes solely for popup/expanded content.
- Preserve meaningful scroll, focus and selection state; test them in a browser.
