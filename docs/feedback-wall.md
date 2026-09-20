# Feedback wall and motion

Updated 2026-09-20. Route: **`/feedback`**. Business page, not a feature route. Current layout revision: source version 8 baseline.

## Intent and design

A youthful collage of outfit stories: bold display typography, compact two-column grid, slightly rotated quote cards, hard offset shadows, pastel pink/lilac/lime and dark plum. Existing Muse/Luna styling images sit beside the quote on wide desktops and above it at narrower widths. Cards stretch within normal grid rows; no row spans, forced empty cells, manual row offsets, clipping or DOM reordering. All six stories are illustrative; every card and shared sample text says so. Images are generated styling content, not customer photographs. There is no real review feed or aggregate rating.

Desktop hover lifts/straightens a card (8px over 320ms); keyboard focus is visible. Touch layout uses one column without tilt. Reduced motion disables movement. Effects do not use scroll listeners, parallax, infinite marquees or a new animation dependency. Existing store layouts keep their accepted grids and margins. Hero and section spacing are tighter to bring the wall into view earlier.

## Interactions and states

| Action/state               | Behavior                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Open composer              | Sheet stays on page; name, rating and story fields; no navigation                                |
| Validate                   | Trimmed name 1–40 characters, story 10–500, integral rating 1–5; error announced in place        |
| Preview                    | One private preview above the wall; focus moves to its heading; no request or public publication |
| Cancel/Escape              | Close and restore trigger focus; keep draft while the component remains mounted                  |
| Leave/reload               | Draft/preview clear; explicitly stated in the composer and preview                               |
| Native share               | User click sends the selected labelled text to the device share menu; no page URL/query change   |
| Cancel share               | Status says cancelled; no clipboard side effect                                                  |
| Share unavailable/rejected | Try clipboard; if unavailable/denied, show selectable readonly text with focus                   |
| Busy                       | Disable that share button until the promise settles; no false copied/delivered message           |
| Edit existing preview      | Replace its content and reset that card’s share status                                           |

No persistence, auth, uploads, moderation, booking linkage, backend/database or public posting. A real customer review system still needs those product/data decisions before integration. Users choose recipients in their own device share UI; the application does not select them or send messages automatically.

## Source ownership

- `src/app/(store)/feedback/page.tsx`: server route and metadata.
- `src/app/(store)/feedback/feedback.css`: scoped layout, hover/mobile/reduced-motion styles.
- `src/components/store/feedback-wall.tsx`: wall and private composer/card/share helpers; local state.
- `src/lib/feedback.ts`: labelled examples, validation and safe plain-text share formatting.
- `src/components/ui/scroll-reveal.tsx`, `src/app/globals.css`: shared motion behavior.
- Header/footer link to the business page; existing catalog/search state remains local.

## Scroll timing

Opacity 420ms, translate 680ms with an ease-out curve. Default distance 10px, max 16px; stagger max 120ms. IntersectionObserver starts revealing 64px before viewport entry. Initial near-viewport content is never hidden; content skipped during a fast scroll reveals immediately. Keyboard focus and reduced-motion preference also bypass transition/delay. The observer disconnects after reveal; listeners are removed on unmount. Without JavaScript the HTML remains visible.

## Tests and browser limits

`tests/feedback.test.mjs`: bounds/rating/sample data/share labels. `tests/feedback-interactions.test.jsx`: validation/escaping/focus/local state, native/copy/manual paths and cancellation. `tests/motion.test.jsx`: progressive enhancement, intersections/fast jumps, reduced motion and focus. Production HTTP checks route, metadata, labels and absence of fabricated aggregate rating schema. Current results: `lookbook-feedback-review.md`; prior motion implementation: `feedback-motion-review.md`.

Web Share depends on device/browser and user activation; resolving its promise does not consistently mean delivery to a recipient. Clipboard writes may be rejected and require a secure context. These differences are why the UI includes explicit cancellation and manual copy. API references: [MDN Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share), [MDN Clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText).
