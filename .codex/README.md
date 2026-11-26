# Codex native agents — rental-store

Six project-local custom roles include `orchestrator`, `developer`, `tester`, `reviewer`, `debugger` and `designer`. The **main Codex session is the true coordinator by default**; choose the optional orchestrator subagent for complex planning only. Roles live at `.codex/agents/*.toml` and are registered in `.codex/config.toml`.

## Usage

Open this directory in a current Codex CLI/app/extension. Tell the root: **“Use the rental-store agent protocol. Split this into bounded tasks; delegate implementation to developer, independent verification to tester, and read-only review to reviewer. Validate JSON handoffs with scripts/validate-agent-message.mjs.”** Assign a reproducible defect to `debugger`.

For a design task, tell the root: **“Delegate to `designer/design`. Audit the customer theme using this Canva reference. Keep the current layout and report exact tokens, asset gaps and desktop/tablet/mobile QA.”** By default this is a read-only audit. Name the exact paths and authorize presentation edits if the designer should implement them. Use `developer` for remaining UI integration, followed by independent `tester` and `reviewer`.

Read `AGENTS.md` first, then `.codex/protocol/README.md`. The root should create bounded task envelopes and validate both sides. Task and result examples are under `.codex/protocol/examples/`.

```sh
node scripts/validate-agent-message.mjs task .codex/protocol/examples/task.developer.json
node scripts/validate-agent-message.mjs result .codex/protocol/examples/result.developer.json --task .codex/protocol/examples/task.developer.json
node --test tests/agent-protocol.test.mjs
```

## Isolation and efficiency

- Use no more than three concurrent agents, and one active writer per file.
- Custom TOML instructions cannot provide a security sandbox. Actual permission enforcement depends on root Codex sandbox/approvals, host tooling, filesystem ACLs/worktrees, and review of the real diff.
- Agents inherit root model unless explicitly configured otherwise. No speculative model names or provider overrides.
- Protocol caps are handoff bytes, not actual model context or tool tokens.
- Agents must never infer an unexecuted test PASS.
- Follow the current business scope in `AGENTS.md` and `docs/feature.md`.

## Reference

Official: https://learn.chatgpt.com/docs/agent-configuration/subagents ; https://learn.chatgpt.com/docs/config-file/config-reference ; https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra
