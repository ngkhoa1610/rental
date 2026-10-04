# Rental Store — working rules

Read `docs/structure.md`, `docs/feature.md`, and `docs/setup.md` before changes. They are the three current project documents; old phase reports remain in the earlier versioned source checkpoint. The user may authorize a new scope that supersedes historical phase limits.

- Keep the approved business: no product variants; size is advice, dates follow Asia/Ho_Chi_Minh, same-day/next-day return is valid, pending order does not reserve inventory, confirmed/renting does, offline payment is a separate append-only ledger. Do not invent prices, deposits, shipping fees, contact details, or shop claims.
- Customer and admin have separate routes, menus, auth cookies, sessions, CSRF and task permissions. Never expose admin navigation/data through customer UI or infer staff rights from OIDC claims.
- Default to Server Components; client components only for interaction. Preserve the current sakura UI, balanced layout, accessibility, Vietnamese default, reduced-motion behavior and scoped action feedback. Search/filter/sort remain local without `/search` or unnecessary navigation.
- Keep route composition in `src/app`, reusable UI in `src/components`, pure rules/contracts in `src/lib`, server-only auth/HTTP/business/DB in `src/server`. `admin-read-service.ts` owns admin list queries. Follow installed Next.js docs for framework APIs.
- Before implementation, write a bounded rule and UAT scenario in the relevant one of the three docs. Preserve business logic and migration history. Use database transactions, ownership, CSRF/origin, runtime validation, version, idempotency and audit where applicable.
- After code, format, lint, test, build, smoke, security source review and desktop/mobile browser QA for affected flows. `npm run check` additionally includes dependency audit. Report PASS/FAIL/BLOCKED accurately; historical results are not current evidence. Do not touch a production/shop DB for source-only work.
- Update the three docs and versioned source checkpoint after implementation. Deliver only changed files relative to the last baseline, state the role of each, list deletions/renames, give reproduction steps and limitations. Full source is retained for continuation; do not attach full source unless requested.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
Read the installed guide in `node_modules/next/dist/docs/` for APIs being edited. The `next dev` tool may regenerate this block.
<!-- END:nextjs-agent-rules -->
