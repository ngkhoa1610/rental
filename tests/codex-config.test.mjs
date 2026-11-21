import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repo = process.cwd();
const roles = ['orchestrator', 'developer', 'tester', 'reviewer', 'debugger'];
const text = (file) => readFileSync(resolve(repo, file), 'utf8');

test('project config registers exactly the five intended custom roles', () => {
  const config = text('.codex/config.toml');
  assert.match(config, /max_concurrent_threads_per_session\s*=\s*3/);
  const registered = [...config.matchAll(/^\[agents\.([a-z]+)\]$/gm)].map((x) => x[1]);
  assert.deepEqual(registered.sort(), [...roles].sort());
  for (const role of roles) {
    assert.match(config, new RegExp('config_file\\s*=\\s*"agents/' + role + '\\.toml"'));
    assert.ok(existsSync(resolve(repo, `.codex/agents/${role}.toml`)));
  }
});

test('custom role files contain identity, concise routing and actionable instructions', () => {
  for (const role of roles) {
    const content = text(`.codex/agents/${role}.toml`);
    assert.match(content, new RegExp(`^name = "${role}"`, 'm'));
    assert.match(content, /^description = "[^"\n]{20,}"$/m);
    assert.match(content, /^developer_instructions = '''[\s\S]+'''\s*$/m);
    assert.match(content, /TaskEnvelope/);
    assert.match(content, /ResultEnvelope/);
    assert.match(content, /NEEDS_CONTEXT/);
    assert.match(content, /AGENTS\.md/);
    assert.ok(Buffer.byteLength(content) <= 6000, `${role}: over 6KiB instructions budget`);
    assert.doesNotMatch(content, /Claude Code|\.claude\/|danger-full-access/);
  }
});

test('agent output constraints separate reviewer and tester duties', () => {
  assert.match(text('.codex/agents/reviewer.toml'), /Never edit/);
  assert.match(text('.codex/agents/tester.toml'), /MUST NOT edit production/);
  assert.match(text('.codex/agents/orchestrator.toml'), /Do not spawn subagents recursively/);
});

test('validator, docs, protocol and sample files use Codex project paths', () => {
  assert.match(text('scripts/validate-agent-message.mjs'), /\.codex\/protocol/);
  assert.doesNotMatch(text('scripts/validate-agent-message.mjs'), /\.claude\/agents/);
  for (const file of ['task.schema.json','result.schema.json','examples/task.developer.json','examples/result.developer.json']) {
    assert.ok(existsSync(resolve(repo, `.codex/protocol/${file}`)));
  }
  assert.match(text('AGENTS.md'), /\.codex\/agents/);
});
