# Lookbook — outfit guide

Route: **`/lookbook`**. Updated 2026-09-20, baseline source version 8.

## Purpose

Help a visitor turn an outfit image into a wearable combination. Collections groups editorial themes; Catalog finds individual pieces; Lookbook explains how to style them. Three guides cover Date night, Vacation and Weekend with pairing, finishing-touch and personalization notes.

## User flow

1. Read the outfit-guide introduction and choose an occasion shortcut, or browse normally.
2. The shortcut scrolls to and focuses the matching story heading in the same page. Reduced motion uses instant scrolling. URL/history do not change.
3. Read the styling notes and featured piece with a sample price/duration from `lib/catalog.ts`.
4. Explicitly select Explore to visit `/products/muse-dress`, `/products/luna-set` or `/products/soleil-top`.

Suggested shoes, bags and accessories are styling ideas, not included items or confirmed stock. Images/prices remain illustrative. Product detail owns selection actions; the lookbook does not create a reservation or duplicate bag actions.

## Ownership and states

- `src/app/(store)/lookbook/page.tsx`: Server Component, metadata, private editorial story data, product lookup and composition.
- `src/app/(store)/store.css`: scoped intro/shortcut/notes/product treatment; retains the existing two-column editorial grid, image frames and gutters.
- Existing `SectionButton` handles scroll/focus; `ScrollReveal` handles progressive entrances; `FashionImage` retains its accessible failure fallback.
- All guides are prerendered and visible without JavaScript. Shortcuts need JavaScript. No API, persistence, loading request or new state layer; missing referenced products are omitted safely. Product data integrity is covered by build/HTTP checks.

## Verification

`tests/lookbook-interactions.test.jsx` covers all three exact product destinations, local scrolling/history/focus and keyboard reduced-motion behavior. Production smoke checks confirm all guides and accessory/sample boundaries exist in server HTML. Full evidence and browser limitation: `lookbook-feedback-review.md`.
