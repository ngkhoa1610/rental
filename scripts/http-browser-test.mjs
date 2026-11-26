/** Ephemeral SQL-backed HTTP/browser UAT. Run through scripts/integration-test.mjs. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
const { PrismaClient } = createRequire(import.meta.url)(
  "../src/generated/prisma/client.ts",
);

const url = process.env.RENTAL_TEST_DATABASE_URL;
if (!url) throw new Error("Use the isolated integration-test runner.");
const origin = process.env.APP_ORIGIN;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});
const output = "artifacts/qa/backend-services/http";
await mkdir(output, { recursive: true });
let server;
let browser;
let passed = 0;
const pass = (label) => console.log(`PASS ${++passed}: ${label}`);
const sessionDigest = (token) =>
  createHash("sha256").update(token).digest("hex");
const customerToken = randomBytes(32).toString("base64url");
const adminToken = randomBytes(32).toString("base64url");
try {
  await db.user.createMany({
    data: [
      {
        id: "http-customer",
        name: "HTTP customer",
        email: "customer@test.invalid",
        phone: "0900000000",
      },
      {
        id: "http-admin",
        name: "HTTP admin",
        email: "admin@test.invalid",
        phone: "0900000001",
      },
    ],
  });
  await db.staffProfile.create({
    data: {
      userId: "http-admin",
      isOwner: true,
      permissions: [
        "orders_manage",
        "catalog_manage",
        "availability_manage",
        "payments_write",
        "content_manage",
        "customers_read",
        "reviews_moderate",
        "staff_manage",
      ],
    },
  });
  await db.session.createMany({
    data: [
      {
        id: "http-cs",
        userId: "http-customer",
        scope: "customer",
        sessionToken: sessionDigest(customerToken),
        expires: new Date(Date.now() + 3600000),
      },
      {
        id: "http-as",
        userId: "http-admin",
        scope: "admin",
        sessionToken: sessionDigest(adminToken),
        expires: new Date(Date.now() + 3600000),
      },
    ],
  });
  await db.product.create({
    data: {
      slug: "http-fixture",
      name: "HTTP fixture dress",
      category: "Dresses",
      collection: "Fixture collection",
      description: "Fixture from SQL, not sample catalog.",
      price: 110000,
      rentalDays: 3,
      quantity: 2,
      visibility: "published",
      images: {
        create: {
          url: "/images/sakura-muse-dress.png",
          alt: "Fixture dress",
          position: 0,
        },
      },
    },
  });
  await db.product.create({
    data: {
      slug: "hidden-fixture",
      name: "Hidden fixture",
      category: "Dresses",
      collection: "Internal",
      description: "Unpublished",
      price: 50000,
      rentalDays: 3,
      quantity: 1,
      visibility: "draft",
      images: {
        create: {
          url: "/images/sakura-luna-set.png",
          alt: "Private fixture dress",
          position: 0,
        },
      },
    },
  });
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3210",
    ],
    {
      env: {
        ...process.env,
        RENTAL_BUILD_DIR: ".next-http",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverLog = "";
  server.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  let ready = false;
  for (let i = 0; i < 160; i++) {
    try {
      ready = (await fetch(origin + "/api/v1/products")).ok;
    } catch {}
    if (ready || server.exitCode !== null) break;
    await delay(100);
  }
  assert.ok(ready, `HTTP server failed: ${serverLog.slice(-1200)}`);
  const products = await (await fetch(origin + "/api/v1/products")).json();
  assert.equal(products.data.length, 1);
  assert.equal(products.data[0].slug, "http-fixture");
  assert.equal("quantity" in products.data[0], false);
  const html = await (await fetch(origin + "/products/http-fixture")).text();
  assert.match(html, /HTTP fixture dress/);
  assert.doesNotMatch(html, /Hidden fixture/);
  pass("public SQL catalog, PDP and private field projection");
  const guest = await fetch(origin + "/api/v1/me/orders");
  assert.equal(guest.status, 401);
  const cross = await fetch(origin + "/api/v1/admin/products", {
    headers: {
      cookie: `__Secure-rental.customer.session-token=${customerToken}`,
    },
  });
  assert.equal(cross.status, 401);
  const customerSession = await fetch(origin + "/api/v1/session", {
    headers: {
      cookie: `__Secure-rental.customer.session-token=${customerToken}`,
    },
  });
  assert.equal(customerSession.status, 200);
  assert.equal((await customerSession.json()).data.profile.id, "http-customer");
  const adminSession = await fetch(origin + "/api/v1/admin/session", {
    headers: { cookie: `__Secure-rental.admin.session-token=${adminToken}` },
  });
  assert.equal(adminSession.status, 200);
  const adminProducts = await fetch(origin + "/api/v1/admin/products", {
    headers: { cookie: `__Secure-rental.admin.session-token=${adminToken}` },
  });
  assert.equal(adminProducts.status, 200);
  assert.equal((await adminProducts.json()).data.length, 2);
  pass("session ownership and customer/admin API boundary");
  const { chromium } = await import(
    process.env.PLAYWRIGHT_MODULE_PATH
      ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href
      : "playwright"
  );
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    await context.addCookies([
      {
        name: "__Secure-rental.customer.session-token",
        value: customerToken,
        url: origin.replace("http:", "https:"),
        secure: true,
        sameSite: "Lax",
      },
      {
        name: "__Secure-rental.admin.session-token",
        value: adminToken,
        url: origin.replace("http:", "https:"),
        secure: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin + "/products");
    await page
      .getByText("HTTP fixture dress", { exact: true })
      .first()
      .waitFor();
    assert.equal(
      await page.getByText("Hidden fixture", { exact: true }).count(),
      0,
    );
    assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
    await page.screenshot({
      path: `${output}/catalog-${width}.png`,
      fullPage: true,
    });
    await page.goto(origin + "/products/http-fixture");
    await page.getByRole("heading", { name: "HTTP fixture dress" }).waitFor();
    await page.screenshot({
      path: `${output}/product-${width}.png`,
      fullPage: true,
    });
    await page.goto(origin + "/account/orders");
    await page
      .locator('.store-account-nav a[href="/account/orders"]')
      .waitFor();
    assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
    await page.goto(origin + "/admin/products");
    await page
      .getByText("HTTP fixture dress", { exact: true })
      .first()
      .waitFor();
    await page.screenshot({
      path: `${output}/admin-products-${width}.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    pass(`customer/admin live UI and desktop/mobile ${width}`);
    await context.close();
  }
  console.log(`${passed} HTTP browser checks passed.`);
} finally {
  await browser?.close();
  if (server) {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      delay(5000),
    ]);
  }
  await db.$disconnect();
}
