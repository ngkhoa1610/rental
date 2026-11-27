# Agent-to-agent Protocol v1 — Rental Store

This is a **prompt + local validator** contract, not a running message bus. The host tool must explicitly route the validated JSON to the next agent. Roles cannot talk autonomously unless the host supports delegation. **All payloads are JSON objects only** (UTF-8, no code fences); descriptions and evidence should be terse.

## Envelope limits (enforced by `scripts/validate-agent-message.mjs`)

| Boundary            | Limit                                     | Rationale                                 |
| ------------------- | ----------------------------------------- | ----------------------------------------- |
| Task payload        | **4 KiB** serialized UTF-8                | prevents context dumping                  |
| Result payload      | **6 KiB** serialized UTF-8                | short handoff, enough test/finding detail |
| Goal                | 500 characters                            | one clear objective                       |
| Acceptance criteria | max 6, 220 chars each                     | measurable, no essays                     |
| Allowed paths       | max 12                                    | bound read/write scope                    |
| Context refs        | max 8; path + why + optional line range   | pointers, not full file contents          |
| Results             | max 8 checks, 8 findings, 8 evidence refs | avoid forwarding complete logs            |
| Active work         | max 3 active subagents                    | prevent agent cascades                    |

## Required flow

1. The main thread defines the scope and may ask the optional planner for a `coordinate` plan with exact child `allowed_paths` and `context_refs`.
2. Check task JSON: `node scripts/validate-agent-message.mjs task path/to/task.json`.
3. Host delegates task to named role. The agent reads only paths relevant to its task and emits **one** `result` JSON file/body.
4. Validate result: `node scripts/validate-agent-message.mjs result path/to/result.json`. Validator checks schema, role-action match, size, path safety, forbidden path references, status logic and internally consistent check exit codes.
5. The main thread also compares `changed_files` against the **original task `allowed_paths`** (use `--task path/to/task.json` with result validation); checks task identity and prevents scope creep. Tool permissions / filesystem controls still enforce actual write limits.
6. The main thread routes corrections after `FAIL`, provides bounded context after `NEEDS_CONTEXT`, and records the missing prerequisite after `BLOCKED`. After implementation, it gathers independent tester and reviewer evidence before acceptance.

## Routing and ownership

| Assigned role | Action     | May change project files?                                                          | Returns to                            |
| ------------- | ---------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| orchestrator  | coordinate | No                                                                                 | Main thread                           |
| developer     | implement  | Yes, approved paths                                                                | Main thread, then tester and reviewer |
| debugger      | diagnose   | Yes, approved paths                                                                | Main thread, then tester and reviewer |
| tester        | test       | Test paths only                                                                    | Main thread                           |
| reviewer      | review     | No                                                                                 | Main thread                           |
| designer      | design     | Approved presentation and design docs only when explicitly assigned implementation | Main thread                           |

Orchestrator can create child envelopes; only the host starts/dispatches actual agent processes. `tester` and `reviewer` remain independent of implementer. For design work, the parent dispatches `designer/design` before implementation and links the approved references and affected frontend paths. Include in the goal whether the assignment is read-only or includes presentation edits. For read-only design return an empty `changed_files` array. Continue with `developer/implement` if integration is needed, then `tester/test` and `reviewer/review` for independent verification. Never run two writers on one file concurrently.

## Context hygiene

- Send _objective, constraints, criteria, path pointers, evidence references_, not original conversation transcripts or full source files.
- Use targeted `Read`/`Grep`/`Glob` and limit output. Prefer `src/server/http/security.ts:42-100` over a 1,000-line pasted file.
- No `.env` or populated environment files, private keys, credentials, session cookies, personal user data, logs with secrets, `node_modules`, `.next`, generated Prisma client, dependency lockfiles as agent handoffs.
- Read AGENTS.md, this protocol and the three current project docs as baseline context. The parent names relevant skills and source in allowed_paths. Return NEEDS_CONTEXT for other essential source.
- A `PASS` without execution evidence is invalid for tester. Reviewer `PASS` means review within supplied scope, not application-wide certification.
- `.agent-work/` is ignored local scratch for envelopes and evidence summaries. Never store secrets; never commit scratch data.

## Status meanings

`PASS`: assigned acceptance criteria met with appropriate evidence. `FAIL`: observed mismatch or verified defect. `BLOCKED`: external prerequisite / environment prevents evaluation. `NEEDS_CONTEXT`: one or more essential path pointers or repro details missing. `INVALID_INPUT`: invalid or contradictory envelope; stop before touching code.

## Validation is not sandboxing

Schemas and prompts limit intended handoffs but do not by themselves enforce runtime file access or token counts. Use host agent isolation and tool permissions; diff auditing and `--task` validate declared changes, not actual filesystem writes. Validator uses the built-in Node.js runtime and no extra dependencies.

See `examples/task.developer.json` and `examples/result.developer.json`. Validate both with the command above. See `.codex/README.md` for agent selection.

## Codex runtime

Codex discovers standalone roles in `.codex/agents/*.toml`. The project config sets the concurrent subagent limit. The parent thread normally acts as orchestrator; `orchestrator` custom role is optional. Ask for subagents explicitly if your Codex client does not delegate automatically. These JSON envelopes are an **application-level convention**, not the native tool protocol: the parent must package and validate task/result JSON when using the contract. Subagents inherit parent sandbox/approvals and MCP settings; textual read/write restrictions are not filesystem security. Run `git diff --name-only` in the parent to audit actual writes.

**Do not forward** large search output, test output, conversation transcripts, source contents, credentials, `.env` files or production records. Each task contains only criteria, constraints, authorized path pointers and exact checks. Keep large evidence in local tool outputs and reference file:line or command label.

Use `handoff_from` for a baseline or diff command. Evidence references are repository file paths with optional line numbers or files under `.agent-work/<task_id>/`.

The `next_owner=orchestrator` wire value returns control to the main thread. The optional planner handles planning only.
