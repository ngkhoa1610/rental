/** Production flow and responsive QA. Uses the same runtime variables as api-browser-test.mjs. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href
    : "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const origin = process.env.RENTAL_QA_ORIGIN ?? "http://127.0.0.1:3100";
const server = process.env.RENTAL_QA_ORIGIN
  ? null
  : spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3100",
      ],
      { stdio: "pipe" },
    );
const output = process.env.RENTAL_QA_OUTPUT ?? "artifacts/qa/fashion-ui";
await mkdir(output, { recursive: true });
let checks = 0;
const pass = (label) => console.log(`PASS ${++checks}: ${label}`);
const future = (days) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
async function noOverflow(page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    `Horizontal overflow: ${page.url()}`,
  );
}
async function screenshot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${output}/${name}.png`,
    fullPage: !/drawer|confirmation/.test(name),
  });
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      ready = (await fetch(origin)).ok;
    } catch {}
    if (ready) break;
    await delay(100);
  }
  assert.ok(ready, "Production server ready");
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(origin);
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page.getByRole("heading", { level: 1 }).waitFor();
    await noOverflow(page);
    assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
    await page.getByRole("button", { name: "Tiếng Việt", exact: true }).click();
    await screenshot(page, `home-${width}`);
    await page.getByRole("button", { name: "English", exact: true }).click();
    const url = page.url();
    await page
      .getByRole("button", { name: "Quick advice", exact: true })
      .first()
      .click();
    const contact = page.getByRole("dialog");
    await contact.getByText(/^Zalo/).waitFor();
    assert.equal(
      await contact.locator('a[href^="tel:"],a[href*="zalo.me"]').count(),
      0,
    );
    await page.keyboard.press("Escape");
    await contact.waitFor({ state: "hidden" });
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      "Quick advice",
    );
    pass(
      `home, honest contact states, focus return and customer boundary ${width}`,
    );
    await page.getByLabel("Pickup date", { exact: true }).fill(future(12));
    await page.getByLabel("Return date", { exact: true }).fill(future(13));
    await page
      .getByRole("button", { name: "Find available looks", exact: true })
      .click();
    await page
      .locator(".store-quick-results .store-product-card")
      .first()
      .waitFor();
    assert.equal(page.url(), url);
    await page
      .locator('.store-quick-results a[href="/products/muse-dress"]')
      .first()
      .click();
    await page.waitForURL(`${origin}/products/muse-dress`);
    assert.equal(
      await page.getByLabel("Pickup date", { exact: true }).inputValue(),
      future(12),
    );
    await page
      .locator('.store-calendar-grid button[data-state="available"]')
      .first()
      .waitFor();
    await noOverflow(page);
    await page.getByRole("button", { name: "Tiếng Việt", exact: true }).click();
    await screenshot(page, `product-${width}`);
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page.getByRole("button", { name: "S", exact: true }).click();
    await page
      .getByRole("button", { name: "Reserve these dates", exact: true })
      .click();
    const drawer = page.getByRole("dialog");
    await drawer
      .getByRole("button", { name: "Try customer account", exact: true })
      .click();
    await drawer.getByRole("heading", { name: "Demo customer" }).waitFor();
    await drawer
      .getByRole("button", { name: "Check availability", exact: true })
      .click();
    await drawer
      .getByRole("heading", { name: "Sample quote", exact: true })
      .waitFor();
    await screenshot(page, `drawer-${width}`);
    await drawer
      .getByRole("button", { name: "Send demo request", exact: true })
      .click();
    await drawer
      .getByRole("heading", {
        name: "We've received your request.",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await drawer.getByAltText("Store bank transfer QR").count(),
      0,
    );
    await drawer
      .getByRole("button", { name: "Copy booking details", exact: true })
      .click();
    await drawer.getByText(/Copied\. Paste|Copy is unavailable/).waitFor();
    const closeBox = await drawer
      .getByRole("button", { name: "Close", exact: true })
      .boundingBox();
    assert.ok(
      closeBox && closeBox.y >= 0 && closeBox.y + closeBox.height <= 900,
      "Close remains in view after confirmation",
    );
    await screenshot(page, `confirmation-${width}`);
    await drawer
      .getByRole("link", { name: "View your requests", exact: true })
      .click();
    await page.waitForURL(`${origin}/account/orders`);
    await page.getByText("Pending approval", { exact: true }).first().waitFor();
    pass(
      `quick search retains dates, size advice, drawer login/quote/create, receipt and copy ${width}`,
    );
    await noOverflow(page);
    assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
    for (const route of [
      "/availability",
      "/accessories",
      "/rental-guide",
      "/feedback",
      "/products",
      "/cart",
    ]) {
      await page.goto(`${origin}${route}`);
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      await noOverflow(page);
    }
    assert.deepEqual(errors, []);
    pass(
      `new routes and existing catalog/cart/feedback; no overflow or console errors ${width}`,
    );
    await context.close();
  }
  for (const width of [320, 768]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const route of [
      "/",
      "/products/muse-dress",
      "/rental-guide",
      "/feedback",
      "/account/orders",
    ]) {
      await page.goto(`${origin}${route}`);
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      await noOverflow(page);
    }
    pass(`responsive overflow ${width}`);
    await context.close();
  }
  console.log(`Fashion browser QA: ${checks} groups passed.`);
} finally {
  await browser.close();
  if (server) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
}
