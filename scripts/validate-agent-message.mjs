#!/usr/bin/env node
/** Offline, dependency-free validator for handoffs. No commands are executed. */
import { readFileSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const validActions = { orchestrator: 'coordinate', developer: 'implement', tester: 'test', reviewer: 'review', debugger: 'diagnose', designer: 'design' };

function safePath(p) {
  if (typeof p !== 'string' || !p || p.includes('\\') || p.includes('\0') || isAbsolute(p) || /(^|\/)\.\.(\/|$)/.test(p) || p.startsWith('./') || p.includes('//') || /^([a-z]+):\/\//i.test(p)) return false;
  const forbidden = /(^|\/)(\.env(?:\..*)?|\.git|node_modules|\.next|\.agent-work|coverage|dist|build|\.DS_Store)(\/|$)/i;
  if (forbidden.test(p) || /^src\/generated\//.test(p) || /(^|\/)(?:[^/]*\.pem|[^/]*\.key|[^/]*\.log)$/i.test(p)) return false;
  const resolved = resolve(projectRoot, p);
  const rel = relative(projectRoot, resolved);
  return Boolean(rel) && !rel.startsWith('..') && !isAbsolute(rel);
}
function typeMatches(value, type) {
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type;
}
function inspect(value, schema, key, errors) {
  if (schema.const !== undefined && value !== schema.const) errors.push(`${key}: must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${key}: unsupported value`);
  if (schema.type && !(Array.isArray(schema.type) ? schema.type.some(t => typeMatches(value, t)) : typeMatches(value, schema.type))) {errors.push(`${key}: incorrect type`); return;}
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${key}: too short`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${key}: too long`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${key}: invalid format`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${key}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${key}: above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${key}: too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${key}: too many items`);
    if (schema.uniqueItems && new Set(value.map(JSON.stringify)).size !== value.length) errors.push(`${key}: duplicates`);
    if (schema.items) value.forEach((v, i) => inspect(v, schema.items, `${key}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const required of schema.required ?? []) if (!(required in value)) errors.push(`${key}.${required}: missing`);
    if (schema.additionalProperties === false) for (const prop of Object.keys(value)) if (!(prop in (schema.properties ?? {}))) errors.push(`${key}.${prop}: unexpected field`);
    for (const [prop, s] of Object.entries(schema.properties ?? {})) if (prop in value) inspect(value[prop], s, `${key}.${prop}`, errors);
  }
}
function extraChecks(data, kind, task, errors) {
  if (data.message_type !== kind) errors.push(`message_type must be ${kind}`);
  if (validActions[data.role] !== data.action) errors.push('action does not match agent role');
  for (const path of data.allowed_paths ?? []) if (!safePath(path)) errors.push(`unsafe allowed_paths: ${path}`);
  for (const item of data.context_refs ?? []) if (!safePath(item.path)) errors.push(`unsafe context_refs: ${item.path}`);
  for (const item of data.changed_files ?? []) if (!safePath(item.path)) errors.push(`unsafe changed_files: ${item.path}`);
  for (const item of data.findings ?? []) if (item.path && !safePath(item.path)) errors.push(`unsafe finding path: ${item.path}`);
  for (const p of data.requested_context ?? []) if (!safePath(p)) errors.push(`unsafe requested_context: ${p}`);
  if (kind === 'task') {
    for (const item of data.context_refs ?? []) if (!(data.allowed_paths ?? []).includes(item.path) && !['AGENTS.md','.codex/protocol/README.md'].includes(item.path)) errors.push(`context_ref outside allowed_paths: ${item.path}`);
  } else {
    if (data.role === 'reviewer' && (data.changed_files ?? []).length) errors.push('reviewer must not change files');
    if (data.role === 'orchestrator' && (data.changed_files ?? []).length) errors.push('orchestrator must not change files');
    if (data.role === 'tester' && (data.changed_files ?? []).some(f => !(f.path.startsWith('tests/') || /(?:^|\/)[^/]+\.test\.[cm]?[jt]sx?$/.test(f.path)))) errors.push('tester may report changes only in tests/**');
    if (data.status === 'NEEDS_CONTEXT' && !(data.requested_context ?? []).length) errors.push('NEEDS_CONTEXT requires requested_context');
    if (data.status !== 'NEEDS_CONTEXT' && (data.requested_context ?? []).length) errors.push('requested_context only valid with NEEDS_CONTEXT');
    if (data.role === 'tester' && data.status === 'PASS' && (!(data.checks ?? []).some(c => c.outcome === 'pass') || (data.checks ?? []).some(c => c.outcome !== 'pass'))) errors.push('tester PASS requires executed passing checks only');
    if (data.status === 'PASS' && (data.findings ?? []).some(f => ['blocker','major'].includes(f.severity))) errors.push('PASS cannot contain major/blocker findings');
    for (const c of data.checks ?? []) {
      if (c.outcome === 'pass' && c.exit_code !== 0) errors.push(`passing command requires exit_code=0: ${c.command}`);
      if (c.outcome === 'fail' && (c.exit_code === null || c.exit_code === 0)) errors.push(`failed command requires nonzero exit_code: ${c.command}`);
      if (['blocked','not_run'].includes(c.outcome) && c.exit_code !== null) errors.push(`nonexecuted command requires null exit_code: ${c.command}`);
    }
    if (task) {
      if (task.task_id !== data.task_id || task.parent_task_id !== data.parent_task_id || task.role !== data.role || task.action !== data.action) errors.push('result identity / lineage does not match task');
      for (const f of data.changed_files ?? []) if (!(task.allowed_paths ?? []).includes(f.path)) errors.push(`changed file outside task allowed_paths: ${f.path}`);
    }
  }
}
export function validateEnvelope(kind, data, { task = undefined, bytes = undefined } = {}) {
  const errors = [];
  if (!['task','result'].includes(kind)) return ['kind must be task or result'];
  const maxBytes = kind === 'task' ? 4096 : 6144;
  const payloadBytes = bytes ?? Buffer.byteLength(JSON.stringify(data));
  if (payloadBytes > maxBytes) errors.push(`payload exceeds ${maxBytes} bytes`);
  const schemaFile = resolve(projectRoot, `.codex/protocol/${kind}.schema.json`);
  const schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
  inspect(data, schema, '$', errors);
  if (data && typeof data === 'object' && !Array.isArray(data)) extraChecks(data, kind, task, errors);
  return errors;
}

function usage() {
  process.stderr.write('Usage: node scripts/validate-agent-message.mjs task|result <message.json> [--task <task.json>]\n');
  process.exitCode = 2;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [kind, filename, option, taskPath, ...rest] = process.argv.slice(2);
  if (!['task','result'].includes(kind) || !filename || rest.length || (option && (option !== '--task' || kind !== 'result' || !taskPath))) usage();
  else {
    try {
      const input = readFileSync(filename);
      if (input.byteLength > (kind === 'task' ? 4096 : 6144)) throw new Error('payload exceeds byte limit');
      const data = JSON.parse(input.toString('utf8'));
      const task = taskPath ? JSON.parse(readFileSync(taskPath,'utf8')) : undefined;
      const errors = [ ...(task ? validateEnvelope('task',task) : []), ...validateEnvelope(kind, data,{task,bytes:input.byteLength}) ];
      if (errors.length) { process.stderr.write('INVALID\n'+errors.map(e=>`- ${e}`).join('\n')+'\n'); process.exitCode=1; }
      else process.stdout.write(`VALID ${kind} ${data.task_id}\n`);
    } catch (error) { process.stderr.write(`INVALID: ${error.message}\n`); process.exitCode=1; }
  }
}
