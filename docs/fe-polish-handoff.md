# FE polish — changed-file handoff

Package: `rental-store-fe-polish-changes-2026-09-14-r01.zip`.
Baseline: full-source checkpoint version 5 (the prior 2026-09-14 delivery/naming rules update).
Baseline archive SHA-256: `ba80ae3c5ade12b30aefcf64e5de58f36b30350c560699b55417a882cde191b0`.

## Apply

1. Start with that baseline project. If you have local edits, compare them first; do not overwrite your own work blindly.
2. Extract this ZIP **into the existing project root**. Paths begin with `src/`, `docs/`, etc.; there is no extra `rental-main/` wrapper. Each file has its complete replacement content.
3. No files were deleted or renamed. Unlisted project files remain as they were.
4. Run `npm ci` because package/lockfile add development tools. Then `npm run check` and `npm run dev`.
5. Read `fe-polish-review.md`: automation passes, but browser acceptance is still blocked in the current environment. Complete the browser checklist before backend integration.

The package is incremental, not a standalone project. The internal checkpoint retains complete source. Core Button/Sheet/Separator/Tooltip/utils changes are formatting only to establish a reproducible format gate; runtime dependency versions did not change.

## Added files

- `.prettierignore`
- `.prettierrc.json`
- `docs/fe-polish-handoff.md`
- `docs/fe-polish-review.md`
- `docs/image-sources.md`
- `public/images/hero-street-style.jpg`
- `public/images/luna-set.jpg`
- `public/images/muse-dress.jpg`
- `public/images/rental-edit.jpg`
- `public/images/soleil-wardrobe.jpg`
- `public/images/summer-editorial.jpg`
- `src/app/error.tsx`
- `src/app/not-found.tsx`
- `src/components/layout/nav-link.tsx`
- `src/components/store/catalog-form.tsx`
- `src/components/store/clear-bag-button.tsx`
- `src/components/ui/fashion-image.tsx`
- `tests/dom-setup.mjs`
- `tests/interactions.test.jsx`
- `tests/motion.test.jsx`

## Modified files

- `AGENTS.md`
- `README.md`
- `docs/FEATURES.md`
- `docs/PROJECT_MEMORY.md`
- `docs/PROJECT_STATE.md`
- `docs/QA.md`
- `docs/WORKFLOW.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `scripts/smoke-test.mjs`
- `src/app/(store)/collections/page.tsx`
- `src/app/(store)/loading.tsx`
- `src/app/(store)/lookbook/page.tsx`
- `src/app/(store)/products/[slug]/page.tsx`
- `src/app/(store)/store.css`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/store/catalog-view.tsx`
- `src/components/store/page-heading.tsx`
- `src/components/store/product-card.tsx`
- `src/components/store/product-gallery.tsx`
- `src/components/store/rental-bag.tsx`
- `src/components/store/saved-looks.tsx`
- `src/components/store/selection-actions.tsx`
- `src/components/store/selection-provider.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/tooltip.tsx`
- `src/lib/catalog.ts`
- `src/lib/utils.ts`
- `tests/catalog.test.mjs`

## Deleted / renamed files

None.
