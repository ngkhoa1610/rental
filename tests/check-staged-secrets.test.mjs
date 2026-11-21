import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const scanner = fileURLToPath(
  new URL("../scripts/check-staged-secrets.mjs", import.meta.url),
);
const hook = fileURLToPath(new URL("../.githooks/pre-commit", import.meta.url));
const sentinel = "ghp_" + "s".repeat(36);
const templateKey = ["AUTH", "SECRET"].join("_");
const cleanSource = "export const sample = true;\n";

function assertSuccess(result) {
  assert.equal(result.status, 0, result.stderr || result.error?.message);
}

function assertBlocked(result, finding) {
  assert.equal(result.status, 1, result.stderr || result.error?.message);
  assert.match(result.stderr, finding);
  assert.doesNotMatch(result.stderr, new RegExp(sentinel));
}

function fixture(t) {
  const temp = realpathSync(tmpdir());
  const cwd = mkdtempSync(join(temp, "rental-guard-"));
  t.after(() => {
    assert.equal(dirname(cwd), temp);
    assert.ok(basename(cwd).startsWith("rental-guard-"));
    rmSync(cwd, { recursive: true, force: true });
  });
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)),
  );
  env.GIT_CONFIG_NOSYSTEM = "1";
  env.GIT_CONFIG_GLOBAL = join(cwd, "empty-gitconfig");
  const run = (command, args) =>
    spawnSync(command, args, { cwd, env, encoding: "utf8" });
  const git = (...args) => run("git", args);
  const write = (path, contents) => writeFileSync(join(cwd, path), contents);
  const stage = (...paths) => assertSuccess(git("add", "-f", "--", ...paths));
  const scan = () => run(process.execPath, [scanner]);
  const commit = (hooksPath) =>
    git(
      "-c",
      `core.hooksPath=${hooksPath}`,
      "-c",
      "user.name=Rental Store Tests",
      "-c",
      "user.email=test@example.invalid",
      "-c",
      "commit.gpgSign=false",
      "commit",
      "-m",
      "Synthetic commit fixture",
    );

  assertSuccess(git("init", "--quiet"));
  return { cwd, write, stage, scan, git, commit };
}

test("scanner accepts clean staged source and a blank env example", (t) => {
  const repo = fixture(t);
  repo.write("clean file.mjs", cleanSource);
  repo.write(".env.example", `${templateKey}=\n`);
  repo.stage("clean file.mjs", ".env.example");
  assertSuccess(repo.scan());
});

test("scanner blocks force-staged private paths and a filled env example", (t) => {
  const repo = fixture(t);
  repo.write("private signing.p8", "synthetic non-secret file content");
  repo.write(".envrc", "synthetic non-secret file content");
  repo.write(".env.example", `${templateKey}=synthetic-fixture\n`);
  repo.stage("private signing.p8", ".envrc", ".env.example");
  const result = repo.scan();
  assertBlocked(result, /private signing\.p8.*protected path/);
  assert.match(result.stderr, /\.envrc.*protected path/);
  assert.match(result.stderr, /sensitive template value must stay blank/);
  assert.doesNotMatch(result.stderr, /synthetic-fixture/);
});

test("scanner does not echo a recognizable token in a staged filename", (t) => {
  const repo = fixture(t);
  const path = `${sentinel}.mjs`;
  repo.write(path, "synthetic non-secret file content");
  repo.stage(path);
  assertBlocked(repo.scan(), /secret pattern in a staged filename/);
});

test("scanner reads the index in both directions for partially staged files", (t) => {
  const repo = fixture(t);
  const blockedSource = `export const fixture = "${sentinel}";\n`;

  repo.write("example.mjs", blockedSource);
  repo.stage("example.mjs");
  repo.write("example.mjs", cleanSource);
  assertBlocked(repo.scan(), /example\.mjs.*GitHub token/);

  repo.stage("example.mjs");
  repo.write("example.mjs", blockedSource);
  assertSuccess(repo.scan());
});

test("scanner allows removal of a previously tracked sensitive path", (t) => {
  const repo = fixture(t);
  repo.write("legacy.key", "synthetic non-secret file content");
  repo.stage("legacy.key");
  assertSuccess(repo.commit(".git/no-hooks"));
  assertSuccess(repo.git("rm", "--", "legacy.key"));
  assertSuccess(repo.scan());
});

test("pre-commit hook accepts clean content and refuses a staged token", (t) => {
  const repo = fixture(t);
  mkdirSync(join(repo.cwd, "scripts"));
  mkdirSync(join(repo.cwd, ".githooks"));
  copyFileSync(scanner, join(repo.cwd, "scripts", "check-staged-secrets.mjs"));
  const installedHook = join(repo.cwd, ".githooks", "pre-commit");
  copyFileSync(hook, installedHook);
  chmodSync(installedHook, 0o755);

  repo.write("clean file.mjs", cleanSource);
  repo.write(".env.example", `${templateKey}=\n`);
  repo.stage("clean file.mjs", ".env.example");
  const cleanCommit = repo.commit(".githooks");
  if (
    process.platform === "win32" &&
    /NtCreateDirectoryObject.*0xC0000022/i.test(cleanCommit.stderr)
  ) {
    t.skip("Git for Windows cannot start the hook shell in this sandbox");
    return;
  }
  assertSuccess(cleanCommit);

  repo.write("bad.mjs", `export const fixture = "${sentinel}";\n`);
  repo.stage("bad.mjs");
  assertBlocked(repo.commit(".githooks"), /bad\.mjs.*GitHub token/);
});
