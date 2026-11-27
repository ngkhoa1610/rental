# Codex native agents — rental-store

The main Codex session coordinates all work. Six custom roles live in `.codex/agents/*.toml`, and `.codex/config.toml` caps concurrent subagents at three. The `orchestrator` subagent can plan a complex sequence for the main session to dispatch.

## Dispatch and acceptance

Open this directory in Codex and start with [AGENTS.md](../AGENTS.md) and the [handoff protocol](protocol/README.md). The main session delegates all project tasks, including one-file, documentation, and read-only requests. Use the optional planner only when sequencing or ownership needs a separate plan. Send read-only work directly to the relevant inspection role. For changes, the main session records the bounded rule and UAT, assigns the appropriate implementer, and sends the stable diff to independent `tester` and `reviewer` agents. Run those two in parallel when their assignments do not write the same files.

For visual or interaction changes, start with a `designer/design` spec. The main session approves it within the user's scope and passes the cited spec and observable criteria to the implementer and both independent agents. The protocol defines the scratch path and how to request a revision. The main session checks the actual diff and tool exit codes before accepting a result and applies the existing Git checkpoint procedure. If the host prevents delegation, record that stage as `BLOCKED` and continue with the authorized checks.

Validate both sides of each task against the original assignment. The existing examples exercise the CLI.

```sh
node scripts/validate-agent-message.mjs task .codex/protocol/examples/task.developer.json
node scripts/validate-agent-message.mjs result .codex/protocol/examples/result.developer.json --task .codex/protocol/examples/task.developer.json
node --test tests/agent-protocol.test.mjs tests/codex-config.test.mjs
```

## ECC skill selection

Runtime and security policies apply first. Follow the user's current scope, project instructions, role boundaries, and applicable project skills before using ECC. UI work uses `ui-ux`. Sensitive changes or security reviews use the project's `security-review` for defensive source review and local fixtures. Distinguish it from `ecc:security-review` by its project path.

The coordinator names a supplemental skill and the concrete gap it addresses in the existing task `constraints` when useful. Choose at most one supplemental ECC skill per assignment as a default. Read it only when the named trigger applies. If the host does not expose it, use the project procedure and record the unavailable capability only if it affects a requested check. Skill guidance does not authorize extra agents, commands, paths, installations, or access to another system.

| Role           | Optional ECC skill          | Activation condition                                                                                                                                                |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main session   | `ecc:change-impact`         | A cross-layer or high-risk request needs evidence of the affected paths before dispatch. Delegate that bounded analysis to the planner when it is already assigned. |
| `orchestrator` | `ecc:change-impact`         | An assigned plan needs a dependency or rollback analysis that the existing source map does not answer and the main session has not already done.                    |
| `designer`     | `ecc:frontend-a11y`         | A form, dialog, menu, or keyboard interaction needs an accessibility pattern in the design spec.                                                                    |
| `developer`    | `ecc:error-handling`        | The scoped change adds or modifies typed failures, retry behavior, or user-facing failure feedback.                                                                 |
| `debugger`     | `ecc:click-path-audit`      | A reproducible interaction fails across multiple actions or shared state transitions. Follow the assigned local repro.                                              |
| `tester`       | `ecc:e2e-testing`           | An assigned Playwright check needs coverage for a critical browser path or diagnosis of flakiness. Use existing browser tooling.                                    |
| `reviewer`     | `ecc:mcp-dependency-review` | An MCP configuration diff changes a command, package pin, or source. Inspect it statically within the assigned scope.                                               |

Local delegation and verification already cover ECC orchestration, generic TDD, and verification-loop workflows. Use the existing tests, independent review, and repository checks as the quality gates. A supplemental skill may inform a check inside an assigned role. It does not create a second pipeline.

## Codex compatibility

| Capability               | Installed evidence and project use                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native plugin and skills | Codex CLI `0.171.0-alpha.13.2` reported `ecc@ecc` enabled at `2.2.3`, with the `affaan-m/ECC` marketplace. The app server reported 365 enabled ECC skill entries, including the six mapped skills. The declared `./skills/` contained 328 skill files on disk.                  |
| Native roles and routing | Codex role files and the existing TaskEnvelope/ResultEnvelope v1 contract handle dispatch. The ECC plugin manifest declares no role import.                                                                                                                                     |
| Lifecycle hooks          | The Codex manifest declares one `SessionStart` bootstrap through `hooks/codex-hooks.json`. Codex listed it as untrusted. Codex skips untrusted hooks. The workflow uses explicit context references. ECC's four Claude hook profiles are Claude-specific.                       |
| MCP                      | Codex listed the bundle's `chrome-devtools` MCP enabled via pinned `chrome-devtools-mcp@1.10.1`. The project uses its existing browser test path by default. Use the bundled server only for an explicitly assigned browser task that needs it.                                 |
| Learning                 | The Codex hook declaration includes no automatic observation loop. ECC's `continuous-learning-v2` describes Claude capture. `ecc:unified-memory` describes a separate ECC Memory Vault CLI and optional MCP runtime. Use the review practice below with existing project files. |

To recheck on another host, run `codex --version`, `codex plugin marketplace list --json`, and `codex plugin list --json`. Compare the installation's Codex manifest and declared hook/MCP files before relying on newly surfaced capabilities.

## Context and learning

- The main session uses [the source map](../docs/structure.md) to select owning routes, contracts, services, storage, and tests. Send the child exact paths and relevant sections in `context_refs` and only the required files in `allowed_paths`. Keep one writer per file and at most three active subagents.
- After independent verification, turn a repeated, evidenced issue into a short, general lesson if it will change a future decision. Apply the reviewed promotion practice from `ecc:unified-memory` by linking evidence to the canonical artifact and reviewing a proposed update before recording it in the existing map, rules or setup docs. The project uses manual documentation review. The ECC Memory Vault is an optional separate runtime. A reusable project skill needs a recurring procedure and a clear activation condition.
- Keep persistent context limited to reviewed project conventions, stable path pointers and synthetic examples. Exclude credentials, tokens, session cookies, personal or production records, populated environment files, raw transcripts, logs and sensitive runtime details. Keep task evidence in ignored scratch and remove it after acceptance.

## Reference

[Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference), [OpenAI plugin packaging and hook trust](https://developers.openai.com/plugins/build/plugins), [ECC upstream](https://github.com/affaan-m/ECC).
