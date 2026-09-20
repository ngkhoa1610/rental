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

let checks = 0;
function pass(message) {
  checks += 1;
  console.log(`PASS ${message}`);
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
    ["/collections", "Start with a feeling."],
    ["/lookbook", "Wear it your way."],
    ["/feedback", "The Feedback Wall — Rental Store"],
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
      !html.includes('href="/search"') &&
        !/<a\b[^>]*href="[^"#]*[?]/.test(html),
      `Feature navigation found on ${path}`,
    );
    pass(path);
  }

  const lookbook = await readPage("/lookbook");
  assert.match(lookbook.html, /Your outfit guide/);
  assert.match(lookbook.html, /Suggested accessories are not included/);
  for (const slug of ["muse-dress", "luna-set", "soleil-top"]) {
    assert.ok(lookbook.html.includes(`id="look-${slug}"`));
    assert.ok(lookbook.html.includes(`href="/products/${slug}"`));
  }
  assert.equal(
    (lookbook.html.match(/<dt>Pair it with<\/dt>/g) ?? []).length,
    3,
  );
  pass(
    "lookbook prerenders three styling guides and their featured product destinations",
  );

  const feedback = await readPage("/feedback");
  assert.match(feedback.html, /not verified customer reviews/);
  assert.equal((feedback.html.match(/SAMPLE STORY/g) ?? []).length >= 6, true);
  assert.doesNotMatch(feedback.html, /AggregateRating|ratingCount|reviewCount/);
  assert.match(feedback.html, /href="\/feedback"/);
  pass(
    "feedback wall has labelled samples and business navigation, no fake rating schema",
  );

  const filtered = await readPage("/products?category=Sets&occasion=Vacation");
  assert.match(filtered.html, /href="\/products\/luna-set"/);
  assert.match(filtered.html, /href="\/products\/muse-dress"/);
  pass("legacy query does not control local catalog state");

  const removed = await readPage("/search");
  assert.equal(removed.response.status, 404);
  pass("removed search feature route returns 404");

  const escaped = await readPage(
    "/products?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
  );
  assert.doesNotMatch(escaped.html, /<script>alert\(1\)<\/script>/);
  pass("ignored hostile legacy query");

  const unknown = await readPage("/products/unknown-look");
  assert.equal(unknown.response.status, 404);
  pass("unknown product returns 404");
  const missing = await readPage("/page-that-does-not-exist");
  assert.equal(missing.response.status, 404);
  assert.match(missing.html, /This page is out of the wardrobe/);
  pass("branded page 404");

  const secured = await readPage("/products");
  assert.equal(
    secured.response.headers.get("x-content-type-options"),
    "nosniff",
  );
  assert.equal(
    secured.response.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.match(
    secured.response.headers.get("content-security-policy"),
    /object-src 'none'/,
  );
  assert.match(
    secured.response.headers.get("permissions-policy"),
    /camera=\(\)/,
  );
  assert.equal(secured.response.headers.get("x-powered-by"), null);
  pass("security response headers");

  const rejected = await readPage(
    "/_next/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg&w=640&q=75",
  );
  assert.equal(rejected.response.status, 400);
  pass("image optimizer rejects external origins");

  for (const name of [
    "sakura-muse-dress",
    "sakura-luna-set",
    "sakura-soleil-top",
  ]) {
    const response = await fetch(`${origin}/images/${name}.png`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /image\/png/);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.length > 1000 && bytes[0] === 137 && bytes[1] === 80);
    pass(`local image ${name}`);
  }
  const optimized = await fetch(
    `${origin}/_next/image?url=%2Fimages%2Fsakura-muse-dress.png&w=640&q=75`,
  );
  assert.equal(optimized.status, 200);
  assert.match(optimized.headers.get("content-type"), /image\//);
  pass("local product image optimization");
  assert.equal(
    (secured.html.match(/>Clear filters<\/button>/g) ?? []).length,
    0,
    "No reset when no filters are active",
  );
  pass("no duplicate or unnecessary reset control");
  console.log(`${checks} production HTTP smoke checks passed.`);
} finally {
  if (server.exitCode === null) server.kill("SIGTERM");
  await stopped;
}
