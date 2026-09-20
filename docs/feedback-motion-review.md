# Feedback wall & scroll motion — review

Date: **2026-09-20**. Baseline: full-source **version 7**. Existing layouts accepted by the user; new `/feedback` collage layout is within the current request. Source hash: `a2b017f72350d46c4ca3a6bf5a3280f3c788643decbbbc4b76d6de0a69ab4c89`.

## Delivered behavior

- Shared scroll reveal begins before entry, travels less, eases out smoothly and immediately reveals content for keyboard/reduced-motion/fast-scroll paths. No scroll hijacking or animation dependency.
- `/feedback`: expressive type, staggered quote cards, polaroid styling photos, pastel pink/lilac/lime and plum; fine-pointer hover lifts and straightens cards, mobile stacks them without tilt. Existing store layouts and gutters remain.
- Six explicitly illustrative stories. A Sheet creates one private local preview; user-initiated sharing uses native share, clipboard or selectable manual text. Cancel does not copy. No public posting or persistence claim.
- Added business navigation, route metadata, feature docs and rules. Data/UI ownership is local to the feature; dependencies and lockfile unchanged. No BE/database.

## Final verification

Command: `npm run check`, **exit 0** on final application code. Runtime Node.js 24.19.0; Next.js 16.3.4 / React 19.2.8. Documentation formatting is checked separately after report generation.

| Gate                            | Result            | Evidence                                                                                                                                                                                                           |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Format                          | PASS              | Prettier 3.6.2, `npm run format:check`                                                                                                                                                                             |
| Lint                            | PASS              | ESLint exit 0, no lint warnings/errors                                                                                                                                                                             |
| Pure tests                      | PASS              | 37 catalog/feedback/selection/storage tests                                                                                                                                                                        |
| DOM interactions                | PASS              | 25 tests including 6 feedback flows and 6 motion cases; native/copy/manual paths, cancellation, escaped input, local state and focus                                                                               |
| Production build                | PASS              | Compile/type/prerender, 13 generated pages; `/feedback` is static                                                                                                                                                  |
| Production HTTP                 | PASS              | 23 checks: routes, labelled feedback/no aggregate schema, removed search 404, ignored legacy query, recovery, headers, local images/optimizer                                                                      |
| Dependency audit                | PASS              | `npm audit --audit-level=moderate`: 0 vulnerabilities, including development dependencies                                                                                                                          |
| Changed-source security review  | PASS within scope | Escaped input/plain-text sharing; name/story/rating bounds; no raw HTML/eval/public-secret/fetch/router/URL-state/localStorage additions in new feature; sharing only from a button event                          |
| CSS/source review               | PASS within scope | Scoped collage styles, 767px stack, fine-pointer-only hover, reduced-motion override, visible focus, wrapping/width constraints, native radio labels. Existing page geometry unchanged                             |
| Browser visual/interaction QA   | BLOCKED           | Production server starts, but Cloud Browser opening `http://localhost:3000/feedback` returns `net::ERR_BLOCKED_BY_CLIENT`. No actual screenshot/crop, hover smoothness, mobile rendering or hydration pass claimed |
| Public review/auth/API security | N/A               | No backend, auth, review persistence or public submission exists                                                                                                                                                   |

Color-token checks for `#422338` text: pink `#f7c4dc` 9.08:1, lilac `#e9e0ff` 10.84:1, lime `#e9f1bd` 11.63:1; light text `#fff8fb` on plum 13.13:1. This is not a full rendered-page accessibility audit.

During verification, a stale Turbopack cache caused a persistence panic. The cache was moved aside and the clean build passed, followed by the full gate. A manual-copy focus test initially stalled while formatting a transient DOM equality failure; it now asserts identity as a boolean and retries without serializing the DOM, and the final suite passed. Existing npm proxy / Node module-detection notices remain informational.

## Remaining browser checks

In a browser that can reach the app: check 320/390/768/1440px and 200% zoom, no overlapping/overflowing collage cards, photos and touch targets, slow/fast scrolling and keyboard focus, reduced motion, no-JS content, console/hydration and real device share/clipboard permission paths. In particular, jsdom tests simulate the native share API; they do not send a message or establish real-device delivery.

Drafts disappear on unmount/reload and are not public. Existing images are styling illustrations, not customer photos. To show real customer feedback later requires supplied approved content or a separately scoped backend/moderation flow.

## Reproducibility

Hash method: sorted project-relative files in `src/`, `tests/`, `scripts/`, `public/`, plus package/lock/Next/TypeScript/ESLint/PostCSS/Prettier configuration; hash each path + NUL + bytes + NUL. Docs/build/dependency output are excluded. Final packaging verifies this hash and reconstructs the complete checkpoint from baseline plus the delta. Apply instructions: `feedback-motion-handoff.md`.
