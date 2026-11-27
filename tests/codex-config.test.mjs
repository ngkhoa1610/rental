import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { validateEnvelope } from "../scripts/validate-agent-message.mjs";

const repo = process.cwd();
const roles = [
  "orchestrator",
  "developer",
  "tester",
  "reviewer",
  "debugger",
  "designer",
];
const text = (file) => readFileSync(resolve(repo, file), "utf8");

test("project config sets a concurrency cap and discovers six standalone roles", () => {
  const config = text(".codex/config.toml");
  assert.match(
    config,
    /^\[agents\]\s*max_concurrent_threads_per_session\s*=\s*3\s*$/m,
  );
  assert.doesNotMatch(
    config,
    /^\[agents\.|^\s*(sandbox_mode|approval_policy)\s*=/m,
  );
  const files = readdirSync(resolve(repo, ".codex/agents")).filter((file) =>
    file.endsWith(".toml"),
  );
  assert.deepEqual(files.sort(), roles.map((role) => role + ".toml").sort());
});

test("custom role files contain identity, concise routing and actionable instructions", () => {
  for (const role of roles) {
    const content = text(`.codex/agents/${role}.toml`);
    assert.match(content, new RegExp(`^name = "${role}"`, "m"));
    assert.match(content, /^description = "[^"\n]{20,}"$/m);
    assert.match(content, /^developer_instructions = '''[\s\S]+'''\s*$/m);
    assert.match(content, /TaskEnvelope/);
    assert.match(content, /ResultEnvelope/);
    assert.match(content, /NEEDS_CONTEXT/);
    assert.match(content, /AGENTS\.md/);
    assert.doesNotMatch(content, /^\s*(sandbox_mode|approval_policy)\s*=/m);
    assert.ok(
      Buffer.byteLength(content) <= 6000,
      `${role}: over 6KiB instructions budget`,
    );
    assert.doesNotMatch(content, /Claude Code|\.claude\/|danger-full-access/);
  }
});

test("agent output constraints separate reviewer and tester duties", () => {
  assert.match(text(".codex/agents/reviewer.toml"), /Never edit/);
  assert.match(
    text(".codex/agents/tester.toml"),
    /Write only test files named in allowed_paths/i,
  );
  assert.match(
    text(".codex/agents/orchestrator.toml"),
    /Do not (?:spawn subagents|dispatch)/i,
  );
});

test("validator, docs, protocol and sample files use Codex project paths", () => {
  assert.match(text("scripts/validate-agent-message.mjs"), /\.codex\/protocol/);
  assert.doesNotMatch(
    text("scripts/validate-agent-message.mjs"),
    /\.claude\/agents/,
  );
  for (const file of [
    "task.schema.json",
    "result.schema.json",
    "examples/task.developer.json",
    "examples/result.developer.json",
  ]) {
    assert.ok(existsSync(resolve(repo, `.codex/protocol/${file}`)));
  }
  assert.match(text("AGENTS.md"), /\.codex\/agents/);
  for (const file of [
    ".agents/skills/security-review/SKILL.md",
    ".agents/skills/ui-ux/SKILL.md",
    "scripts/check-translations.mjs",
    ".githooks/pre-commit",
  ]) {
    assert.ok(existsSync(resolve(repo, file)), file);
  }
});

test("designer uses the design action in task and result handoffs", () => {
  const taskExample = JSON.parse(
    text(".codex/protocol/examples/task.developer.json"),
  );
  const resultExample = JSON.parse(
    text(".codex/protocol/examples/result.developer.json"),
  );
  const task = { ...taskExample, role: "designer", action: "design" };
  const result = {
    ...resultExample,
    role: "designer",
    action: "design",
    changed_files: [],
  };

  assert.deepEqual(validateEnvelope("task", task), []);
  assert.deepEqual(validateEnvelope("result", result, { task }), []);
  assert.match(
    validateEnvelope("task", { ...task, action: "implement" }).join(" "),
    /action does not match agent role/,
  );
});
