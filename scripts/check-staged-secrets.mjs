import { execFileSync } from "node:child_process";

const maxOutputBytes = 16 * 1024 * 1024;
const envFile = /(^|\/)\.env[^/]*$/i;
const protectedPath =
  /(^|\/)(?:\.aws|\.ssh|\.gnupg)(?:\/|$)|(^|\/)(?:\.npmrc|\.pypirc|\.netrc|_netrc|\.git-credentials|id_(?:rsa|dsa|ecdsa|ed25519)|(?:credentials|secrets?)(?:\.[^/]+)?)$|\.(?:pem|key|p8|p12|pfx|jks|keystore|zip|7z|rar|tar|tgz|gz)$/i;

const secretFormats = [
  ["private key", /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/],
  [
    "GitHub token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/,
  ],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["Slack token", /\bxox[bpars]-[A-Za-z0-9-]{12,}\b/],
  [
    "API token",
    /\b(?:sk-(?:proj-|svcacct-|ant-)?[A-Za-z0-9_-]{20,}|(?:sk|rk)_live_[A-Za-z0-9]{16,}|AIza[A-Za-z0-9_-]{35})\b/,
  ],
];
const sensitiveName =
  /(?:^|_)(?:secret|token|password|passwd|private_key|api_key|database_url|access_key|access_key_id|auth_token)(?:_|$)/i;
const quotedAssignment =
  /\b([a-z][\w]*)["']?\s*[:=]\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|`([^`\r\n]*)`)/gi;
const envAssignment =
  /^[\t ]*(?:export[\t ]+)?([A-Z][A-Z0-9_]*)[\t ]*=(.*)$/gim;
const documentedDatabaseHost = [
  "postgresql://",
  "USER",
  ":",
  "PASSWORD",
  "@HOST:5432",
].join("");
const documentedPlaceholders = new Set([
  "THAY_BANG_SECRET_NGAU_NHIEN_DU_MANH",
  "SECRET_KHACH",
  "SECRET_ADMIN",
  `${documentedDatabaseHost}/DBNAME?schema=public`,
]);
const credentialUrl =
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis(?:s)?|amqp(?:s)?|https?):\/\/([^\s:/@{}$<>]+):([^\s/@{}$<>]+)@([^\s/'"`<>]+)/gi;

function git(args) {
  return execFileSync("git", args, {
    maxBuffer: maxOutputBytes,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function stagedFiles() {
  const fields = git([
    "diff",
    "--cached",
    "--raw",
    "--no-abbrev",
    "--no-renames",
    "--diff-filter=ACMT",
    "-z",
    "--",
  ])
    .toString("utf8")
    .split("\0");
  fields.pop();
  if (fields.length % 2 !== 0) throw new Error("Invalid staged file list");

  const files = [];
  for (let index = 0; index < fields.length; index += 2) {
    const match = /^:\d{6} (\d{6}) [\da-f]+ ([\da-f]+) [ACMT]$/.exec(
      fields[index],
    );
    const path = fields[index + 1];
    if (!match || !path) throw new Error("Invalid staged file entry");
    const [, mode, object] = match;
    files.push({ mode, object, path });
  }
  return files;
}

function assignmentValue(rawValue) {
  const value = rawValue.replace(/(?:^|\s)#.*$/, "").trim();
  return value.replace(/^(["'])(.*)\1$/, "$2").trim();
}

function isSensitive(name) {
  return sensitiveName.test(name.replace(/([a-z\d])([A-Z])/g, "$1_$2"));
}

function checkContent(content, path) {
  const template = path === ".env.example";
  for (const [label, pattern] of secretFormats) {
    if (pattern.test(content)) return label;
  }
  for (const match of content.matchAll(credentialUrl)) {
    if (match[0] !== documentedDatabaseHost || path !== "docs/setup.md") {
      return "URL with embedded credentials";
    }
  }
  for (const [, name, rawValue] of content.matchAll(envAssignment)) {
    const value = assignmentValue(rawValue);
    if (!value || !isSensitive(name)) continue;
    if (template) return "sensitive template value must stay blank";
    if (path === "docs/setup.md" && documentedPlaceholders.has(value)) continue;
    return "hard-coded credential assignment";
  }
  for (const [, name, double, single, backtick] of content.matchAll(
    quotedAssignment,
  )) {
    const value = (double ?? single ?? backtick).trim();
    if (value && isSensitive(name)) return "hard-coded credential literal";
  }
  return null;
}

function checkFile({ mode, object, path }) {
  if (
    (envFile.test(path) && path !== ".env.example") ||
    protectedPath.test(path)
  )
    return "protected path";
  if (mode === "160000") return null; // A Git submodule stores a commit ID.

  let blob;
  try {
    blob = git(["cat-file", "blob", object]);
  } catch {
    return "unable to read staged content within scan limit";
  }
  if (blob[0] === 0xff && blob[1] === 0xfe)
    return checkContent(blob.subarray(2).toString("utf16le"), path);
  if (blob[0] === 0xfe && blob[1] === 0xff) {
    const text = blob.subarray(2, blob.length - (blob.length % 2));
    return checkContent(text.swap16().toString("utf16le"), path);
  }
  return checkContent(blob.toString("utf8"), path);
}

try {
  for (const file of stagedFiles()) {
    if (file.path.split("/").some((part) => checkContent(part, ""))) {
      console.error("Commit blocked: secret pattern in a staged filename.");
      process.exitCode = 1;
      continue;
    }
    const finding = checkFile(file);
    if (!finding) continue;
    console.error(`Commit blocked: ${JSON.stringify(file.path)} (${finding}).`);
    process.exitCode = 1;
  }
} catch {
  console.error("Commit blocked: unable to inspect the staged Git index.");
  process.exitCode = 1;
}
