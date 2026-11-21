import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { validateEnvelope } from '../scripts/validate-agent-message.mjs';
const path = '.codex/protocol/examples/';
const task = JSON.parse(readFileSync(path+'task.developer.json'));
const result = JSON.parse(readFileSync(path+'result.developer.json'));
const clone = x => JSON.parse(JSON.stringify(x));

test('example task and result obey the wire contract', () => {
  assert.deepEqual(validateEnvelope('task', task), []);
  assert.deepEqual(validateEnvelope('result', result,{task}), []);
});
test('extra fields rejected rather than silently accepted', () => {
  assert.match(validateEnvelope('task',{...task, huge_context:'unbounded'}) .join(' '),/unexpected field/);
});
test('secret and path traversal rejected', () => {
  for (const path of ['.env', '../secrets', 'src/../../secrets', 'node_modules/foo', '.agent-work/output.json', '/etc/passwd']) {
    const t=clone(task); t.allowed_paths=[path];t.context_refs=[];
    assert.match(validateEnvelope('task',t).join(' '),/unsafe allowed_paths/);
  }
});
test('context pointers must match approved reading scope', () => {
  const t=clone(task);t.context_refs=[{path:'src/server/secret.ts',why:'Other file'}];
  assert.match(validateEnvelope('task',t).join(' '),/outside allowed_paths/);
});
test('task-result mismatch and changed-file scope detected', () => {
  const r=clone(result);r.changed_files=[{path:'src/server/http/handler.ts',change_type:'modified'}];
  assert.match(validateEnvelope('result',r,{task}).join(' '),/outside task allowed_paths/);
  r.changed_files=[];r.task_id='wrong-111';
  assert.match(validateEnvelope('result',r,{task}).join(' '),/identity/);
});
test('reviewer is read-only and tester cannot claim unexecuted PASS', () => {
  const r=clone(result);r.role='reviewer';r.action='review';r.changed_files=[{path:'src/test.ts',change_type:'modified'}];
  assert.match(validateEnvelope('result',r).join(' '),/reviewer must not change files/);
  r.role='tester';r.action='test';r.changed_files=[];r.status='PASS';
  assert.match(validateEnvelope('result',r).join(' '),/tester PASS requires/);
});
test('impossible check statuses and unsupported role actions fail', () => {
  const r=clone(result);r.checks=[{command:'npm test',outcome:'pass',exit_code:1}];
  assert.match(validateEnvelope('result',r,{task}).join(' '),/exit_code=0/);
  const t=clone(task);t.action='review';
  assert.match(validateEnvelope('task',t).join(' '),/does not match/);
});
test('oversize payloads rejected', () => {
  assert.match(validateEnvelope('task',task,{bytes:5000}).join(' '),/exceeds/);
});
test('NEEDS_CONTEXT requires concrete requested path', () => {
  const r=clone(result);r.status='NEEDS_CONTEXT';
  assert.match(validateEnvelope('result',r,{task}).join(' '),/requires requested_context/);
});
