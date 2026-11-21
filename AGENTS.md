# Rental Store — working rules

Read `docs/structure.md`, `docs/feature.md`, and `docs/setup.md` before changes. They are the three current project documents; old phase reports remain in the earlier versioned source checkpoint. The user may authorize a new scope that supersedes historical phase limits.

- Keep the approved business: customer scope is browsing products, checking dates/availability, and sending a rental request; staff review and update orders. No product variants; size is advice; dates follow Asia/Ho_Chi_Minh; same-day/next-day return is valid; pending order does not reserve inventory, confirmed/renting does. Payment is external and out of scope; do not build a payment ledger or imply online payment. Do not invent prices, deposits, shipping fees, contact details, or shop claims.
- Customer and admin have separate routes, menus, auth cookies, sessions, CSRF and task permissions. Never expose admin navigation/data through customer UI or infer staff rights from user-provided credentials or profile data.
- Default to Server Components; client components only for interaction. Preserve the current sakura UI, balanced layout, accessibility, Vietnamese default, reduced-motion behavior and scoped action feedback. Search/filter/sort remain local without `/search` or unnecessary navigation.
- Keep route composition in `src/app`, reusable UI in `src/components`, pure rules/contracts in `src/lib`, server-only auth/HTTP/business/DB in `src/server`. `admin-read-service.ts` owns admin list queries. Follow installed Next.js docs for framework APIs.
- Before implementation, write a bounded rule and UAT scenario in the relevant one of the three docs. Preserve business logic and migration history. Use database transactions, ownership, CSRF/origin, runtime validation, version, idempotency and audit where applicable.
- After code, format, lint, test, build, smoke, security source review and desktop/mobile browser QA for affected flows. `npm run check` additionally includes dependency audit. Report PASS/FAIL/BLOCKED accurately; historical results are not current evidence. Do not touch a production/shop DB for source-only work.
- Update the three docs and versioned source checkpoint after implementation. Deliver only changed files relative to the last baseline, state the role of each, list deletions/renames, give reproduction steps and limitations. Full source is retained for continuation; do not attach full source unless requested.
- For customer UI changes, follow [.agents/skills/ui-ux/SKILL.md](.agents/skills/ui-ux/SKILL.md): prioritize the browse → availability → request journey, retain the sakura identity, and verify responsive, keyboard, Vietnamese and reduced-motion behavior. Use faocamera.vn only as an interaction/layout reference; do not copy its branding or camera-rental claims.
- For security-sensitive changes or a requested security review, follow [.agents/skills/security-pentest.md](.agents/skills/security-pentest.md). Keep assessments authorized and local/source-scoped unless a live target and rules of engagement are explicitly approved. Never run destructive tests or alter a live database.
- The app has separate customer/admin routes, auth scopes, permissions, API contracts, and rental business services. For cross-layer changes, map the route → contract → handler/service → persistence path and define invariants before editing; do not add a separate architecture skill unless the system boundary or deployment topology materially changes.



## Codex agent workflow (project-local)

### Local Git checkpoints

- Create a local commit after a requested feature, fix, or refactor reaches a verified, coherent milestone. Check the diff and applicable verification results first. Keep incomplete work and unrelated changes out of the commit. Confirm a change is in scope before staging its file or hunk.
- Stage explicit paths or hunks and review the staged file list and diff. Use `git add --chmod=+x -- .githooks/pre-commit` when staging the hook itself.
- Run `node scripts/check-staged-secrets.mjs` against the exact staged changes. Use `git -c core.hooksPath=.githooks commit -m "<checkpoint>"` so the hook runs even without local setup. If the guard or Git write fails, leave the checkpoint uncommitted and report the blocker. Keep commits local unless the user authorizes a push.

The main Codex thread owns scope, delegation, integration, and the final result. Delegate every project task to the appropriate agents, regardless of size or risk, including single-file edits, documentation, and read-only work. Assign implementation to `developer` or a reproducible defect to `debugger`, then assign independent verification to `tester` and actual-diff review to `reviewer`. For read-only work, assign the relevant verification or review role directly and record its evidence. Test and review may run in parallel against a stable patch if neither writes files under review. Use `orchestrator` for bounded planning and delegate directly from the main thread. Keep at most three active subagents and one writer per file.

If the host lacks a required role or delegation is restricted, mark that stage BLOCKED, explain the runtime limitation, and continue the stages that can be delegated. Report only checks actually run. This policy supersedes any small-task exception in project-local role prompts or workflow documentation.

All delegated handoffs use a compact JSON TaskEnvelope / ResultEnvelope v1 (4 KiB / 6 KiB) validated with `node scripts/validate-agent-message.mjs`; both schema files and examples live under `.codex/protocol/`. Keep only path pointers and acceptance criteria, never large transcripts, raw logs or secrets. The parent must independently check the actual diff and tool exit codes before accepting a result. Roles and validation are NOT a runtime sandbox.

### Role instructions and scope

Native role definitions live in `.codex/agents/`. Follow the validated handoff protocol for each assignment.

Read these rules before applying project-local role prompts or skills. The current user scope and the product decisions in this file govern each assignment. Retain Admin. The approved credential authentication scope replaces Auth.js/OIDC with email/password and keeps account permissions in StaffProfile.

| Role | Assignment |
| --- | --- |
| `orchestrator` | Return a dependency plan to the main thread. The main thread starts agents and owns integration. |
| `developer` | Implement approved paths. Map route → contract → service → persistence for cross-layer work. |
| `debugger` | Reproduce the assigned defect locally and report before/after evidence for the smallest approved fix. |
| `tester` | Verify acceptance criteria independently. For authentication, test the credential endpoints and session scopes, expiry, CSRF and ownership as applicable. Edit only explicitly assigned tests. |
| `reviewer` | Review the actual patch read-only. Check applicable Admin/customer boundaries, permissions, stock and data integrity. |

Include the relevant project skill and prerequisite docs as context references when assigning work. Apply the UI/UX guidance to Admin as well as customer screens. For security-sensitive changes, apply the security guidance to defensive source review and authorized verification. If an agent needs an additional path, the main thread updates its task scope before it proceeds.

**Current Admin decision:** retain the admin UI and API. Milestone 1 covers dashboard, orders, product cover, and inventory availability. Milestone 2 covers product albums, customer lookup, feedback moderation, and staff permissions. Authentication changes require separate scope. Prisma and PostgreSQL remain the persistence layer.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
