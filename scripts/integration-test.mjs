/** Starts an isolated, ephemeral PostgreSQL cluster; never uses the shop DATABASE_URL. */
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtemp,
  writeFile,
  chmod,
  chown,
  rm,
  readdir,
  readFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { randomBytes } from "node:crypto";
import pg from "pg";
if (process.env.RENTAL_TEST_DB_ENGINE === "pglite") {
  const { PGlite } = await import("@electric-sql/pglite");
  const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");
  const db = await PGlite.create();
  for (const folder of (await readdir("prisma/migrations"))
    .filter((n) => /^\d/.test(n))
    .sort())
    await db.exec(
      await readFile(`prisma/migrations/${folder}/migration.sql`, "utf8"),
    );
  const server = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: 0,
    maxConnections: 4,
  });
  await server.start();
  let resultCode = 1;
  try {
    const url = `postgresql://postgres:postgres@${server.getServerConn()}/postgres`;
    const env = {
      ...process.env,
      DATABASE_URL: url,
      RENTAL_TEST_DATABASE_URL: url,
      DATABASE_POOL_SIZE: "1",
      APP_ORIGIN: "http://127.0.0.1:3210",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      RENTAL_PRICING_MODE: "per-block",
      RENTAL_PRICING_VERSION: "integration-fixture-only",
    };
    const args = process.argv[2]
      ? ["--import", "tsx", process.argv[2]]
      : [
          "--conditions=react-server",
          "--import",
          "tsx",
          "--test",
          "tests/integration/rental-service.test.ts",
        ];
    const child = spawn(process.execPath, args, { env, stdio: "inherit" });
    resultCode =
      (await new Promise((resolve) => child.once("exit", resolve))) ?? 1;
  } finally {
    await server.stop();
    await db.close();
  }
  process.exit(resultCode);
}
const bin = process.env.POSTGRES_BIN_DIR;
if (!bin)
  throw new Error(
    "Set POSTGRES_BIN_DIR to a PostgreSQL bin directory (initdb/postgres).",
  );
const root = await mkdtemp(path.join(tmpdir(), "rental-pg-"));
const asUser = process.getuid?.() === 0 ? { uid: 65534, gid: 65534 } : {};
if (asUser.uid) {
  await chown(root, asUser.uid, asUser.gid);
  await chmod(root, 0o700);
}
const password = randomBytes(24).toString("hex");
const passwordFile = path.join(root, "password");
await writeFile(passwordFile, password, { mode: 0o600 });
if (asUser.uid) await chown(passwordFile, asUser.uid, asUser.gid);
const env = {
  ...process.env,
  LD_LIBRARY_PATH:
    path.resolve(bin, "../lib") +
    (process.env.LD_LIBRARY_PATH ? ":" + process.env.LD_LIBRARY_PATH : ""),
};
execFileSync(
  path.join(bin, "initdb"),
  [
    "-D",
    path.join(root, "data"),
    "-U",
    "rental_test",
    "--pwfile",
    passwordFile,
    "--auth=scram-sha-256",
    "--encoding=UTF8",
    "--locale=C",
  ],
  { ...asUser, env, stdio: "ignore" },
);
await rm(passwordFile);
const socket = net.createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const server = spawn(
  path.join(bin, "postgres"),
  [
    "-D",
    path.join(root, "data"),
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-k",
    root,
  ],
  { ...asUser, env, stdio: ["ignore", "ignore", "pipe"] },
);
let dbError = "";
server.stderr.on("data", (b) => {
  dbError = (dbError + b.toString()).slice(-2000);
});
const url = `postgresql://rental_test:${password}@127.0.0.1:${port}/postgres`;
const pool = new pg.Pool({
  connectionString: url,
  connectionTimeoutMillis: 500,
});
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      await pool.query("SELECT 1");
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (!ready) throw new Error("Temporary PostgreSQL failed: " + dbError);
  for (const folder of (await readdir("prisma/migrations"))
    .filter((n) => /^\d/.test(n))
    .sort())
    await pool.query(
      await readFile(`prisma/migrations/${folder}/migration.sql`, "utf8"),
    );
  const testEnv = {
    ...env,
    DATABASE_URL: url,
    RENTAL_TEST_DATABASE_URL: url,
    APP_ORIGIN: "http://127.0.0.1:3210",
    AUTH_SECRET: randomBytes(32).toString("hex"),
    RENTAL_PRICING_MODE: "per-block",
    RENTAL_PRICING_VERSION: "integration-fixture-only",
  };
  const command = process.argv[2];
  const args = command
    ? ["--import", "tsx", command]
    : [
        "--conditions=react-server",
        "--import",
        "tsx",
        "--test",
        "tests/integration/rental-service.test.ts",
      ];
  const child = spawn(process.execPath, args, {
    env: testEnv,
    stdio: "inherit",
  });
  const code = await new Promise((resolve) => child.once("exit", resolve));
  if (code !== 0) process.exitCode = code ?? 1;
} finally {
  await pool.end();
  server.kill("SIGTERM");
  await new Promise((resolve) => server.once("exit", resolve));
  await rm(root, { recursive: true, force: true });
}
