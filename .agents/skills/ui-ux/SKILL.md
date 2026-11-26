---
name: ui-ux
description: Design, spec and review Rental Store customer or admin screens (layout, hierarchy, tokens, responsive, accessibility). Use for any page, navigation, form, interaction or visual change. Not for API, auth, permission or database work.
---

# UI/UX skill - Rental Store

Adapted from Anthropic `frontend-design` (https://github.com/anthropics/skills/tree/main/skills/frontend-design). Read upstream for the full philosophy; this file holds the project rules and templates.

## Job to be done

browse looks -> inspect a look -> pick dates and quantity -> check availability -> send a rental request -> see receipt and status. Each screen serves the next useful action. Staff review requests and update status in a separate Admin scope. Business rules that constrain design: no size/SKU variants (size is advice), a pending request does not hold stock, payment happens outside the app, never invent prices, deposits or contacts.

## Repo conventions (verified against docs/structure.md and the code)

- UI language is Vietnamese only (`lang="vi"`). Visible text is `<T>{"English source"}</T>`; the English string is the key in `src/lib/translations/vi.json` and a missing key renders English. Add the Vietnamese entry in the same change and run `node scripts/check-translations.mjs`. Reuse an existing key when the action is the same ("Check availability", "Check available dates", "See the rental guide"). `label=` props of ContactOptions are translated inside the component; `aria-label` attributes are plain strings today.
- Tokens live in `src/app/globals.css` `:root`: `--background --foreground --primary --accent --muted --muted-foreground --border --radius-sm|md|lg --page-gutter --page-width`. The customer accent is the sakura `--primary` (#9a5262). ELMEE #660000 is a brand reference from a designer brief, not the current theme; do not migrate to it unless the task is explicitly a theme change.
- Shared store CSS (`store.css`, `home.css`, `booking.css`) is imported in `src/app/(store)/layout.tsx`. A page-specific file may sit beside its route (see `feedback/feedback.css`) or in `(store)/` and be imported by the page. Admin CSS: `src/app/admin/admin.css`. Class names use the `store-` prefix; admin keeps its own.
- Reuse existing building blocks before inventing: `home-cta` (button), `store-product-grid`, `store-breadcrumb`, `store-save-button`, `home-container`, shadcn `Button`/`Sheet`.
- Customer components: `src/components/store/*`; admin: `src/components/admin/*`; `components/ui` and `components/layout` are shared (a change affects many pages). Layout tasks wrap components; they do not edit their internals unless assigned.
- Route pages are Server Components; add a client component only for interaction. Data comes through `src/lib/api` (mock or http) and `src/server/rental`.
- Tests are DOM tests (`tests/*.test.jsx`) that assert Vietnamese accessible labels. Changing a visible label can break them, so the tester runs the focused DOM tests.

## Process: plan, challenge, build, verify

1. PLAN in <=10 lines: palette (existing tokens), type, spacing, hierarchy, mobile behavior, plus an ASCII wireframe for desktop and mobile. Name the ONE primary action per screen and put it in the first viewport.
2. CHALLENGE the plan against these generic tells and revise: identical rounded cards everywhere with the same soft shadow; tracked-out all-caps eyebrow above every heading; one word accented in a headline; numbered markers on non-sequential content; fade-and-slide on every section; gradient washes; repeated placeholder copy such as "to be confirmed". Record what you changed and why.
3. BUILD with restraint: one memorable element, everything else quiet. Motion only when it answers a user action. Check selector specificity so spacing rules do not cancel each other.
4. VERIFY at 1440, 768 and 390 px. Evidence beats opinion: screenshot or "browser QA blocked: <reason>".

## Rental-commerce patterns that work

- Product detail: media left, sticky decision panel right (name, price per rental period, dates, one primary action). Info accordions below the fold. Mobile: sticky bottom bar with price and a "check dates" action. Related looks max 4, ranked by category/collection/occasion.
- Listing: rental dates are the primary filter, so keep them visible, not hidden in a closed disclosure. Local search/filter/sort only.
- Missing data (sizes, fabric, availability): ONE honest note with an action ("Ask the store"), not a "to be confirmed" row repeated in several places.
- Copy: sentence case, a verb that says what happens ("Check dates", "Send request"). Same action keeps the same name across the flow.

## Template: .agent-work/<task_id>/design.md

1. Axis and scope (theme / layout / IA / interaction) and files in scope
2. Baseline and evidence (screenshots or file:line)
3. Scored audit: dimension, score, evidence for deductions
4. References table: URL | observed pattern | why it works | adaptation | risk
5. Wireframes (desktop, mobile) and token map (role -> existing variable, new only with reason)
6. Per-file change list for developer: path, what changes, class names
7. Invariants that must not change; regression risks
8. QA checklist for tester: viewports, states, keyboard, contrast, reduced motion

## Accessibility floor

Semantic HTML, labels, visible focus, 44px touch targets, WCAG AA contrast, reduced-motion respected, Vietnamese diacritics render without clipping.
