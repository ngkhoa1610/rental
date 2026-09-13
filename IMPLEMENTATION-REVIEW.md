# Rental Store — Landing-page implementation review

> Historical checkpoint: 2026-09-09. For the current customer UI phase, read `docs/PROJECT_STATE.md` and `docs/WORKFLOW.md`.

Date: 2026-09-09
Scope: Landing-page UI replication, fashion-domain adaptation, responsive refinement.

## Source of truth

Read both supplied handoffs, the Rental Store application and its AGENTS.md, and the three FAO reference files. The Implementation Contract resolves the older handoff's open questions: fidelity B, authoritative supplied FAO bundles, permission to restructure existing sections, and temporary Unsplash assets. No further product-direction confirmation was needed.

The supplied HTML is a bootstrap shell. The actual homepage is `M$` in the supplied JavaScript. Its composition is `N$` (header), `C$` (hero/perks), `k$` (process), `E$` (FAQ), `_$` (promotion), `D$` (footer), and `$i` (mobile navigation). `p$` is a conditional API-driven promotional popup. The `.home-landing` and `.home-*` rules in the CSS define the relevant visual system; the rest of the application stylesheet was not imported.

## Current → reference → change

| Area | Uploaded Rental Store | Supplied FAO reference | Implemented adaptation |
|---|---|---|---|
| Container | 1440px | 1200px, padding 16/24/32px | 1200px, matching breakpoint padding |
| Header | Floating rounded panel, 64–72px | Full-width sticky bar, 64px | Full-width bar, warm shirt icon, navigation, compact CTA |
| Hero | Oversized editorial heading and media | Equal columns, compact brand heading + subtitle | Brand + fashion-rental subtitle, reference proportions |
| Hero image | Large framed fashion portrait | 4:5 up to 400px on mobile; 380–480px height on desktop | Existing temporary fashion portrait with matching dimensions and offset frame |
| Perks | Three benefits | Three adjacent cells, stacked below 768px | Three fashion-rental concepts; no unconfirmed deposit/cleaning claims |
| Body order | Many discovery/product/lookbook sections | Process → FAQ → promotion | Same compact order, promotion becomes rental edit |
| Process | Large separate step treatments | Four icons joined horizontally; mobile vertical line | Same responsive structure; explanatory copy only |
| FAQ | Native details | Static question/answer rows, two columns at 768px | Native details initially open, matching two-column composition |
| Promotion | Multiple product/image sections | 5:7 image-and-copy split | Fashion poster + three sample looks in compact rows |
| Footer | Dark brown, four groups | White, 5:3:4 columns | Warm white, brand / explore / rental information |
| Mobile | Header-triggered right sheet | Fixed 68px bottom bar | Bottom bar and reused Radix Sheet opening from bottom |
| Typography | Geist | Be Vietnam Pro | Existing Geist retained as available sans-serif fallback; reference weights and scales adapted |

## Reference classification

| Reference element | Treatment | Reason |
|---|---|---|
| Sticky header, width, spacing | REPLICATE | Directly observed in N$ and homepage CSS |
| Hero, frame, three-cell strip | ADAPT | Fashion content and existing temporary photography |
| Four-step process | ADAPT | Explanatory rental concepts, no booking implementation |
| FAQ rows | ADAPT | Native keyboard-accessible disclosures preserved |
| Promotion poster and benefit list | ADAPT | Sample rental edit; no invented discount |
| Light footer and mobile bottom bar | ADAPT | Only working homepage destinations |
| Camera brands, branch addresses, contracts, deposit offers | REMOVE | Camera-specific business information |
| Authentication/account/order controls | REMOVE | Unimplemented Rental Store capabilities |
| API-driven promotional popup and its Swiper | UNKNOWN / OMIT | Requires unconfirmed promotional data; not a default homepage carousel |
| Booking calendar, catalog APIs, payment | REMOVE FROM THIS PHASE | Explicitly out of scope |

## Files changed

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/layout/site-header.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/site-footer.tsx`

This review is the only new documentation file. All application files are included in full in the source archive and are directly replaceable. No partial patches or manual merging are required.

Next.js 16.3.4, React 19.2.8, dependencies, lockfile, configuration and architecture remain unchanged. Button, Sheet and ScrollReveal are reused. Relevant locally installed Next.js documentation was read before edits; the hero uses `preload` instead of deprecated `priority`.

## Behavior and accessibility

- Primary `Explore looks` actions scroll to the rental edit.
- Navigation uses existing homepage anchors; no links to unimplemented product/search/cart/account pages remain on this landing page.
- The mobile bar includes Home, Looks, FAQ and Menu. The existing Sheet primitive handles focus trapping and Escape dismissal; menu selections close it.
- FAQ uses native `details`/`summary`, initially open to resemble the source reference.
- Includes skip navigation, one h1, labeled navigation landmarks, meaningful image alt text, visible focus and 44px minimum primary touch controls.
- Main content remains visible without JavaScript. The existing ScrollReveal adds only a small entrance movement, disabled for reduced-motion users.
- Safe-area padding keeps the mobile footer clear of the fixed bar.

## Confirmed, temporary, unknown

Confirmed: current framework, existing components, supplied reference composition and this landing-page scope.

Temporary: fashion photography, Muse Dress / Luna Set / Soleil Top names, their indicative prices and 3-day examples. The rental edit visibly labels these as samples.

Unknown: real inventory, sizing, availability, delivery charges/options, return terms and booking/payment rules. FAQ copy now explicitly leaves these to confirmation rather than asserting unimplemented operational capabilities.

## Verification

**Verified**

- `npm ci --ignore-scripts --no-audit --no-fund`: dependencies installed from the existing lockfile; no manifest changes.
- `npm run lint`: passed, exit code 0.
- `npm run build`: passed, exit code 0; Next.js compilation, TypeScript and static generation completed.
- Rendered homepage HTML: one h1, four native FAQ disclosures, two nonempty image alt attributes, no duplicate IDs, no missing anchor targets, no destination links outside the existing homepage.
- Both retained Unsplash URLs: HEAD request returned HTTP 200 and image/jpeg.
- Compared against the original ZIP: only the five listed application files changed.

**Not verified**

- Desktop/mobile browser rendering and interaction testing.
- Screenshot or pixel comparison with a rendered FAO page.
- Full image appearance/crop evaluation or Next.js image-optimization response in a running browser.
- Live business workflows, which are outside scope and are not implemented.

## Remaining review

The implementation is ready for visual review, not a claim of pixel-identical completion. Compare at 320/390px, 768px, 1024px and 1440px; check the mobile Sheet, keyboard focus return, FAQ toggles, reduced motion and text enlargement. Geist differs from the reference's Be Vietnam Pro; photography and the fashion poster also intentionally differ. These affect exact visual parity.

The phase stays within the landing page. Do not start catalog, checkout, account, backend or real rental logic without a separate request.
