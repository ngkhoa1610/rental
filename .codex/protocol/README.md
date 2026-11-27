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
3. The main thread delegates to the named role, including for single-file and read-only work. The agent reads the relevant paths and emits **one** `result` JSON file/body.
4. Validate against the original task: `node scripts/validate-agent-message.mjs result path/to/result.json --task path/to/task.json`. The validator checks schema, role-action match, task identity, declared change scope, sizes, paths, statuses and check exit codes.
5. The main thread checks actual changes and executed evidence. It routes corrections after `FAIL`, provides bounded context after `NEEDS_CONTEXT`, and records the missing prerequisite after `BLOCKED`. After implementation, it gathers independent tester and reviewer evidence against the stable diff before acceptance.

## Routing and ownership

| Assigned role | Action     | May change project files?                                                          | Returns to                            |
| ------------- | ---------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| orchestrator  | coordinate | No                                                                                 | Main thread                           |
| developer     | implement  | Yes, approved paths                                                                | Main thread, then tester and reviewer |
| debugger      | diagnose   | Yes, approved paths                                                                | Main thread, then tester and reviewer |
| tester        | test       | Test paths only                                                                    | Main thread                           |
| reviewer      | review     | No                                                                                 | Main thread                           |
| designer      | design     | Approved presentation and design docs only when explicitly assigned implementation | Main thread                           |

The optional `orchestrator` can prepare envelopes for the main thread to dispatch. The `tester` and `reviewer` stay independent of the implementer. Keep one writer per file.

### Design handoff

1. The main thread assigns `designer/design` first for visual or interaction changes. Identify the design axis, relevant references, and affected frontend paths. State whether the task is a read-only spec or explicitly authorized presentation work.
2. For design with downstream implementation, the designer writes `.agent-work/<designer-task-id>/design.md` and returns it in `evidence_refs`. Include observable requirements by affected path, expected states, and QA criteria. A read-only designer leaves `changed_files` empty.
3. Before dispatching implementation, the main thread validates the designer result and confirms that the cited file exists in the assigned designer's scratch, contains observable requirements, and stays within the user and project scope. Resolve a missing or unapproved spec before dispatch. In each implementation and verification task, name the exact approved spec as a read-only artifact in `constraints` and copy its applicable requirements into `acceptance_criteria`. The validator reserves scratch paths for result evidence and rejects them in `allowed_paths` and `context_refs`. The main thread authorizes the exact scratch file for reading and checks that its content remains intact. The implementer follows the spec, Tester evaluates the specified behavior, and Reviewer compares the patch to the same spec.
4. If the approved scratch spec becomes unavailable after dispatch, return `BLOCKED`, name the exact scratch path in `summary` or `risks`, and leave `requested_context` empty because it rejects scratch paths. Report conflicts or material revisions as concrete findings. The main thread resolves or updates the approved requirement before accepting affected work.

## Context hygiene

- Send _objective, constraints, criteria, path pointers, evidence references_, not original conversation transcripts or full source files.
- Use targeted `Read`/`Grep`/`Glob` and limit output. Prefer `src/server/http/security.ts:42-100` over a 1,000-line pasted file.
- No `.env` or populated environment files, private keys, credentials, session cookies, personal user data, logs with secrets, `node_modules`, `.next`, generated Prisma client, dependency lockfiles as agent handoffs.
- The main thread reads the three current project docs before dispatching changes. Children read `AGENTS.md`, this protocol, the relevant skill and the documentation sections and source paths named in `context_refs`. Any `context_refs` pointer other than `AGENTS.md` or this protocol must also appear in `allowed_paths`. The exact read-only Designer spec named in `constraints` is an explicit exception to the normal read scope. Return `NEEDS_CONTEXT` for another essential repo path.
- Use the [role and ECC skill mapping](../README.md#ecc-skill-selection) to name any selected supplemental skill and its task-specific purpose in `constraints`.
- A `PASS` without execution evidence is invalid for tester. Reviewer `PASS` means review within supplied scope, not application-wide certification.
- `.agent-work/` is ignored local scratch for envelopes and evidence summaries. Never store secrets; never commit scratch data.

## Status meanings

`PASS`: assigned acceptance criteria met with appropriate evidence. `FAIL`: observed mismatch or verified defect. `BLOCKED`: external prerequisite / environment prevents evaluation. `NEEDS_CONTEXT`: one or more essential path pointers or repro details missing. `INVALID_INPUT`: invalid or contradictory envelope; stop before touching code.

## Validation is not sandboxing

Schemas and prompts limit intended handoffs but do not by themselves enforce runtime file access or token counts. Use host agent isolation and tool permissions; diff auditing and `--task` validate declared changes, not actual filesystem writes. Validator uses the built-in Node.js runtime and no extra dependencies.

See `examples/task.developer.json` and `examples/result.developer.json`. Validate both with the command above. See `.codex/README.md` for agent selection.

## Codex runtime

Codex discovers standalone roles in `.codex/agents/*.toml`. The project config sets the concurrent subagent limit. The main thread performs mandatory dispatch. If the host lacks a role or prevents delegation, record that stage as `BLOCKED`. The main thread packages and validates the JSON around native dispatch. Host permissions govern actual access. Inspect the real diff, including any new files, to audit actual writes.

**Do not forward** large search output, test output, conversation transcripts, source contents, credentials, `.env` files or production records. Each task contains only criteria, constraints, authorized path pointers and exact checks. Keep large evidence in local tool outputs and reference file:line or command label.

Use `handoff_from` for a baseline or diff command. Evidence references are repository file paths with optional line numbers or files under `.agent-work/<task_id>/`.

The `next_owner=orchestrator` wire value returns control to the main thread. The optional planner handles planning only.
