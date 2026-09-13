/** Production HTTP smoke tests. Start and stop only the server owned by this script. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise((resolve, reject) =>
  socket.close((error) => (error ? reject(error) : resolve())),
);

const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
server.stdout.on("data", (chunk) => {
  logs += chunk;
});
server.stderr.on("data", (chunk) => {
  logs += chunk;
});
const stopped = once(server, "exit");
const origin = `http://127.0.0.1:${port}`;

async function readPage(path) {
  const response = await fetch(`${origin}${path}`, {
    signal: AbortSignal.timeout(15000),
  });
  return { response, html: await response.text() };
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Server stopped before ready:\n${logs}`);
    try {
      const { response } = await readPage("/");
      ready = response.ok;
    } catch {
      /* Wait for this server to bind, within the bounded startup window. */
    }
    if (ready) break;
    await delay(150);
  }
  assert.ok(ready, `Production server did not become ready:\n${logs}`);

  const pages = [
    ["/", "Rental Store"],
    ["/products", "A look for every plan."],
    ["/search", "Find your next look."],
    ["/collections", "Start with a feeling."],
    ["/lookbook", "Wear it your way."],
    ["/wishlist", "Your favourites, together."],
    ["/cart", "Your next plans start here."],
    ["/products/muse-dress", "Muse Dress — Rental Store"],
    ["/products/luna-set", "Luna Set — Rental Store"],
    ["/products/soleil-top", "Soleil Top — Rental Store"],
  ];
  for (const [path, content] of pages) {
    const { response, html } = await readPage(path);
    assert.equal(response.status, 200, path);
    assert.ok(html.includes(content), `Missing expected content on ${path}`);
    assert.equal(
      (html.match(/<h1(?:\s|>)/g) ?? []).length,
      1,
      `One h1 required on ${path}`,
    );
    assert.ok(
      !html.includes('href="#rental-process"') || path === "/",
      `Wrong homepage anchor on ${path}`,
    );
    console.log(`PASS ${path}`);
  }

  const filtered = await readPage("/products?category=Sets&occasion=Vacation");
  assert.match(filtered.html, /Luna Set/);
  assert.doesNotMatch(filtered.html, /href="\/products\/muse-dress"/);
  console.log("PASS combined server filters");

  const empty = await readPage("/search?q=does-not-exist");
  assert.match(empty.html, /No looks match just yet/);
  console.log("PASS empty search");

  const escaped = await readPage(
    "/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
  );
  assert.doesNotMatch(escaped.html, /<script>alert\(1\)<\/script>/);
  console.log("PASS escaped search input");

  const unknown = await readPage("/products/unknown-look");
  assert.equal(unknown.response.status, 404);
  console.log("PASS unknown product returns 404");
  console.log("14 production HTTP smoke checks passed.");
} finally {
  if (server.exitCode === null) server.kill("SIGTERM");
  await stopped;
}
