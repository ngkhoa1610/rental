/** Desktop/mobile production QA; requires Playwright and Chromium. See docs/setup.md. */
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
const origin = process.env.RENTAL_QA_ORIGIN ?? "http://127.0.0.1:3000";
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
        "3000",
      ],
      { stdio: "pipe" },
    );
const output = process.env.RENTAL_QA_OUTPUT ?? "artifacts/qa/admin-boundary";
await mkdir(output, { recursive: true });
let checks = 0;
const pass = (label) => console.log(`PASS ${++checks}: ${label}`);
function futureDate(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function snap(page, name, width) {
  await page.getByRole("button", { name: "Tiếng Việt", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: `${output}/${name}-${width}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "English", exact: true }).click();
}
async function noCustomerAdminLinks(page) {
  assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: /Use admin|Use staff|Open demo controls/ })
      .count(),
    0,
  );
}
async function expectActionNotice(page, text) {
  const notice = page.locator(".store-action-notice");
  await notice.getByText(text, { exact: true }).waitFor();
  assert.equal(await notice.getByRole("status").count(), 1);
  const selection = page.locator(".selection-feedback");
  if (await selection.count()) {
    const actionBox = await notice.boundingBox();
    const selectionBox = await selection.boundingBox();
    if (actionBox && selectionBox)
      assert.ok(
        actionBox.y + actionBox.height <= selectionBox.y,
        "Submit and selection notices must not overlap",
      );
  }
  if (
    text === "Signed in successfully." ||
    text.startsWith("Offline transaction")
  ) {
    const kind = text.startsWith("Offline") ? "admin" : "customer";
    await page.screenshot({
      path: `${output}/notice-${kind}-${page.viewportSize().width}.png`,
    });
  }
  await notice
    .getByRole("button", { name: "Dismiss action notification", exact: true })
    .click();
  await notice.waitFor({ state: "hidden" });
}
async function nav(page, path) {
  await page.locator(`.admin-sidebar a[href="${path}"]`).click();
  await page.waitForURL(`${origin}${path}`);
}
try {
  if (server) {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        ready = (await fetch(origin)).ok;
      } catch {}
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready);
  }
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${origin}/account/orders`);
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page
      .getByRole("button", { name: "Try customer account", exact: true })
      .waitFor();
    await noCustomerAdminLinks(page);
    assert.equal(await page.locator('a[href="/account/history"]').count(), 0);
    await page
      .getByRole("button", { name: "Try customer account", exact: true })
      .click();
    await page
      .locator('.store-account-nav a[href="/account/history"]')
      .waitFor();
    await noCustomerAdminLinks(page);
    await page.getByText("No requests yet", { exact: true }).waitFor();
    await page.locator('.store-account-nav a[href="/account/history"]').click();
    await page
      .getByRole("heading", { name: "Rental history", exact: true })
      .waitFor();
    await snap(page, "customer-history", width);
    if (width === 390) {
      await page
        .getByRole("button", { name: "Open navigation menu", exact: true })
        .click();
      await page.getByRole("dialog").waitFor();
      await noCustomerAdminLinks(page);
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label"),
        ),
        "Open navigation menu",
      );
    }
    pass(`customer guest/login navigation and no admin exposure ${width}`);
    await expectActionNotice(page, "Signed in successfully.");
    await page.locator('.store-account-nav a[href="/account"]').click();
    await page.getByText("Edit contact details", { exact: true }).click();
    await page
      .getByRole("button", { name: "Save contact details", exact: true })
      .click();
    await expectActionNotice(page, "Contact details saved.");

    await page.goto(`${origin}/products/muse-dress`);
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page
      .getByRole("button", { name: "Add to rental bag", exact: true })
      .click();
    await page.locator('.home-header a[href="/cart"]').click();
    await page
      .getByRole("button", { name: "Try customer account", exact: true })
      .click();
    await page.getByLabel("Pickup date", { exact: true }).fill(futureDate(10));
    await page.getByLabel("Return date", { exact: true }).fill(futureDate(10));
    await page
      .getByLabel("Notes for the store (optional)", { exact: true })
      .fill("Browser rental");
    await page
      .getByRole("button", { name: "Check availability", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Send demo request", exact: true })
      .click();
    await page
      .getByRole("link", { name: "View your requests", exact: true })
      .click();
    await page.getByRole("article").waitFor();
    await noCustomerAdminLinks(page);
    await snap(page, "customer-orders", width);
    await page.locator('.store-account-nav a[href="/account/history"]').click();
    await page.getByText("No requests yet", { exact: true }).waitFor();
    pass(`customer same-day request and orders/history destinations ${width}`);
    await expectActionNotice(
      page,
      "Request sent. The store still needs to approve it.",
    );
    await page.goto(`${origin}/cart`);
    await page.getByRole("button", { name: "English", exact: true }).click();
    await noCustomerAdminLinks(page);
    await page.goto(`${origin}/admin/orders`);
    await page
      .getByRole("link", { name: "Admin sign in", exact: true })
      .waitFor();
    assert.equal(
      await page.locator(".home-header,.home-footer,.home-mobile-nav").count(),
      0,
    );
    assert.equal(await page.getByRole("article").count(), 0);
    await page
      .getByRole("link", { name: "Admin sign in", exact: true })
      .click();
    await page.getByRole("button", { name: "Use admin", exact: true }).click();
    await page
      .getByRole("link", { name: "Open overview", exact: true })
      .click();
    await page
      .getByText("Prototype · sample data only", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Load sample data", exact: true })
      .click();
    await page
      .getByText("Sample data loaded. Refresh the current list.", {
        exact: true,
      })
      .waitFor();
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.locator(".admin-stat").first().waitFor();
    await snap(page, "overview", width);
    pass(`admin gate, own shell, seed and dashboard ${width}`);
    await nav(page, "/admin/orders");
    const card = page.getByRole("article", {
      name: "Order sample-order-1",
      exact: true,
    });
    await card.waitFor();
    assert.equal(
      await page.getByText("Record offline payment", { exact: true }).count(),
      0,
    );
    await card
      .locator("summary")
      .filter({ hasText: "Update rental status" })
      .click();
    await card
      .getByLabel("Reason / garment condition", { exact: true })
      .fill("Checked in browser");
    await card
      .getByRole("button", { name: "Update rental status", exact: true })
      .click();
    await card
      .locator(".store-api-badge")
      .filter({ hasText: "Confirmed" })
      .waitFor();
    await snap(page, "orders", width);
    pass(`order transition separate from payment ${width}`);
    await expectActionNotice(page, "Rental status updated.");
    await nav(page, "/admin/payments");
    const pay = page.getByRole("article", {
      name: "Order sample-order-1",
      exact: true,
    });
    await pay.waitFor();
    assert.equal(
      await page.getByText("Update rental status", { exact: true }).count(),
      0,
    );
    await pay
      .locator("summary")
      .filter({ hasText: "Record offline payment" })
      .click();
    await pay.getByLabel("Amount (VND)", { exact: true }).fill("100000");
    await pay
      .getByLabel("Transaction time", { exact: true })
      .fill("2026-01-01T10:00");
    await pay
      .getByLabel("Payment note", { exact: true })
      .fill("Browser cash test");
    await pay
      .getByRole("button", { name: "Record transaction", exact: true })
      .click();
    await pay.getByText("partial", { exact: true }).waitFor();
    await expectActionNotice(
      page,
      "Offline transaction recorded. Rental status is unchanged.",
    );

    await pay.locator('select[name="kind"]').selectOption("refund");
    await pay.getByLabel("Amount (VND)", { exact: true }).fill("50000");
    await pay
      .getByLabel("Transaction time", { exact: true })
      .fill("2026-01-01T11:00");
    await pay
      .getByLabel("Payment note", { exact: true })
      .fill("Browser refund");
    await pay
      .getByRole("button", { name: "Record transaction", exact: true })
      .click();
    await pay
      .getByText(/Offline refund recorded/)
      .waitFor({ state: "attached" });
    await snap(page, "payments", width);
    pass(`offline collection and refund ${width}`);
    await expectActionNotice(
      page,
      "Offline transaction recorded. Rental status is unchanged.",
    );
    await nav(page, "/admin/products");
    const product = page.locator(".admin-panel").filter({
      has: page.getByRole("heading", { name: "Muse Dress", exact: true }),
    });
    await product.getByText("Edit product", { exact: true }).click();
    await product.getByLabel("Name", { exact: true }).fill("Muse Browser");
    await product.getByLabel("Price (VND)", { exact: true }).fill("290000");
    await product
      .getByRole("button", { name: "Save product", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Muse Browser", exact: true })
      .waitFor();
    await snap(page, "products", width);
    pass(`product edit saves ${width}`);
    await expectActionNotice(page, "Product changes saved.");
    await nav(page, "/admin/availability");
    await page.getByLabel("From", { exact: true }).fill(futureDate(20));
    await page.getByLabel("Until", { exact: true }).fill(futureDate(21));
    await page.getByLabel("Reason", { exact: true }).fill("Browser cleaning");
    await page.getByRole("button", { name: "Save block", exact: true }).click();
    await page.getByText("Browser cleaning", { exact: true }).waitFor();
    await snap(page, "availability", width);
    await expectActionNotice(page, "Unavailable dates saved.");
    await page
      .getByRole("button", { name: "Remove block", exact: true })
      .click();
    await page.getByText("No blocked periods.", { exact: true }).waitFor();
    pass(`availability create/remove ${width}`);
    await expectActionNotice(page, "Unavailable dates removed.");
    await nav(page, "/admin/content");
    await page.getByLabel("Title", { exact: true }).fill("Browser story");
    await page
      .getByLabel("Body", { exact: true })
      .fill("<script>only text</script>");
    await page
      .getByRole("checkbox", { name: "Muse Dress", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Save content", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Browser story", exact: true })
      .waitFor();
    await snap(page, "content", width);
    pass(`content draft saves ${width}`);
    await expectActionNotice(page, "Content changes saved.");
    await nav(page, "/admin/reviews");
    const consent = page.locator(".admin-panel").filter({
      has: page.getByText("Publication consent received", { exact: false }),
    });
    await consent.locator('select[name="decision"]').selectOption("approved");
    await consent.getByLabel("Reason", { exact: true }).fill("Consent checked");
    await consent
      .getByRole("button", { name: "Save decision", exact: true })
      .click();
    await consent.getByText(/approved/).waitFor();
    const noConsent = page.locator(".admin-panel").filter({
      has: page.getByText("No publication consent", { exact: false }),
    });
    assert.equal(
      await noConsent
        .locator('option[value="approved"]')
        .evaluate((element) => element.disabled),
      true,
    );
    await snap(page, "reviews", width);
    pass(`review moderation and consent ${width}`);
    await expectActionNotice(page, "Review decision saved.");
    await nav(page, "/admin/customers");
    await page
      .getByLabel("Search name or phone", { exact: true })
      .fill("0900000000");
    await page
      .getByRole("heading", { name: "Demo customer", exact: true })
      .waitFor();
    await snap(page, "customers", width);
    await nav(page, "/admin/team");
    await page
      .getByRole("checkbox", { name: "Manage availability", exact: true })
      .uncheck();
    await page
      .getByRole("button", { name: "Save permissions", exact: true })
      .click();
    await page
      .getByRole("checkbox", { name: "Manage availability", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("checkbox", { name: "Manage availability", exact: true })
        .isChecked(),
      false,
    );
    await snap(page, "team", width);
    pass(`customer search and staff permission update ${width}`);
    await expectActionNotice(page, "Staff access updated.");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expectActionNotice(page, "Signed out of this workspace.");
    await page
      .getByRole("link", { name: "Admin sign in", exact: true })
      .click();
    await page.getByRole("button", { name: "Use staff", exact: true }).click();
    await page
      .getByRole("link", { name: "Open overview", exact: true })
      .click();
    assert.equal(
      await page.locator('.admin-sidebar a[href="/admin/payments"]').count(),
      0,
    );
    assert.equal(
      await page.locator('.admin-sidebar a[href="/admin/team"]').count(),
      0,
    );
    assert.equal(
      await page
        .locator('.admin-sidebar a[href="/admin/availability"]')
        .count(),
      0,
    );
    for (let step = 0; step < 10; step++) {
      await page.goBack({ waitUntil: "networkidle" });
      if (
        [
          "/admin/team",
          "/admin/reviews",
          "/admin/content",
          "/admin/products",
          "/admin/payments",
        ].includes(new URL(page.url()).pathname)
      )
        break;
    }

    await page
      .getByRole("heading", { name: "Access denied", exact: true })
      .waitFor();
    pass(
      `revoked permissions hide nav and direct history entry is denied ${width}`,
    );
    for (const size of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width: size, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow ${size}`,
      );
    }
    await page.locator(".home-skip").focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      "admin-main",
    );
    assert.deepEqual(errors, []);
    pass(`responsive and console ${width}`);
    await context.close();
  }
  console.log(`ALL ${checks} browser groups passed`);
} catch (error) {
  for (const context of browser.contexts())
    for (const page of context.pages()) {
      await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
      console.log((await page.locator("main").innerText()).slice(-12000));
    }
  throw error;
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}
