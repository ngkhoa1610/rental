import "./dom-setup.mjs";
import React from "react";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { SelectionProvider } from "../src/components/store/selection-provider.tsx";
import { ApiProvider } from "../src/components/store/api-provider.tsx";
import { CatalogDataProvider } from "../src/components/store/catalog-data.tsx";
import { translate as t } from "../src/lib/language.ts";
import {
  catalogViewRuntime,
  dress,
  set,
  top,
} from "./catalog-view-fixture.mjs";
import {
  WishlistButton,
  AddToBagButton,
} from "../src/components/store/selection-actions.tsx";
import { RentalBag } from "../src/components/store/rental-bag.tsx";
import { SavedLooks } from "../src/components/store/saved-looks.tsx";
import { ProductGallery } from "../src/components/store/product-gallery.tsx";
import { FashionImage } from "../src/components/ui/fashion-image.tsx";
import { Catalog } from "../src/components/store/catalog.tsx";
import { SiteHeader } from "../src/components/layout/site-header.tsx";
import { SectionButton } from "../src/components/ui/section-button.tsx";

const runtime = catalogViewRuntime();
const routerCalls = [];
const router = {
  push: (...args) => routerCalls.push(args),
  replace() {},
  prefetch() {},
  refresh() {},
  back() {},
  forward() {},
};
function App({ children, pathname = "/products" }) {
  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={pathname}>
        <ApiProvider runtime={runtime}>
          <CatalogDataProvider>
            <SelectionProvider>{children}</SelectionProvider>
          </CatalogDataProvider>
        </ApiProvider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}
afterEach(() => {
  cleanup();
  localStorage.clear();
  routerCalls.length = 0;
});

test("save and add stay in context, persist, and announce the action", async () => {
  const user = userEvent.setup();
  render(
    <App>
      <WishlistButton slug="muse-dress" name={dress.name} />
      <AddToBagButton slug="muse-dress" name={dress.name} />
    </App>,
  );
  await user.click(
    await screen.findByRole("button", {
      name: t("Save {name} to wishlist", { name: dress.name }),
    }),
  );
  assert.equal(
    screen
      .getByRole("button", {
        name: t("Remove {name} from wishlist", { name: dress.name }),
      })
      .getAttribute("aria-pressed"),
    "true",
  );
  await user.click(
    await screen.findByRole("button", { name: t("Add to rental bag") }),
  );
  assert.ok(
    screen.getByRole("button", { name: t("In your rental bag") }).disabled,
  );
  assert.deepEqual(
    JSON.parse(localStorage.getItem("rental-store.selection.v1")).bag,
    ["muse-dress"],
  );
  assert.match(
    screen.getByRole("status").textContent,
    new RegExp(t("{name} added to your rental bag.", { name: dress.name })),
  );
  assert.equal(routerCalls.length, 0);
  await user.click(
    screen.getByRole("button", { name: t("Dismiss notification") }),
  );
  assert.equal(screen.getByRole("status").textContent, "");
});

test("restored bag supports cancel then confirm clear without losing wishlist", async () => {
  localStorage.setItem(
    "rental-store.selection.v1",
    JSON.stringify({
      version: 1,
      wishlist: ["muse-dress"],
      bag: ["muse-dress", "luna-set"],
    }),
  );
  const user = userEvent.setup();
  render(
    <App>
      <RentalBag />
    </App>,
  );
  await user.click(
    await screen.findByRole("button", { name: t("Clear bag"), exact: true }),
  );
  assert.ok(screen.getByRole("dialog", { name: t("Clear your rental bag?") }));
  await user.click(screen.getByRole("button", { name: t("Keep my looks") }));
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(
    JSON.parse(localStorage.getItem("rental-store.selection.v1")).bag.length,
    2,
  );
  await user.click(
    await screen.findByRole("button", { name: t("Clear bag"), exact: true }),
  );
  await user.click(screen.getByRole("button", { name: t("Yes, clear bag") }));
  assert.ok(
    screen.getByRole("heading", {
      name: t("A little room for your next look."),
    }),
  );
  const saved = JSON.parse(localStorage.getItem("rental-store.selection.v1"));
  assert.deepEqual(saved.bag, []);
  assert.deepEqual(saved.wishlist, ["muse-dress"]);
  await waitFor(() =>
    assert.equal(
      document.activeElement?.getAttribute("aria-label"),
      t("Rental bag contents"),
    ),
  );
  assert.equal(routerCalls.length, 0);
});

test("removing the last favourite shows empty state and restores usable focus", async () => {
  localStorage.setItem(
    "rental-store.selection.v1",
    JSON.stringify({ version: 1, wishlist: ["muse-dress"], bag: [] }),
  );
  const user = userEvent.setup();
  render(
    <App>
      <SavedLooks />
    </App>,
  );
  await user.click(
    await screen.findByRole("button", {
      name: t("Remove {name} from wishlist", { name: dress.name }),
    }),
  );
  assert.ok(
    screen.getByRole("heading", { name: t("Keep the looks you love.") }),
  );
  await waitFor(() =>
    assert.equal(
      document.activeElement?.getAttribute("aria-label"),
      t("Saved looks"),
    ),
  );
  assert.equal(routerCalls.length, 0);
});

test("gallery opens in place; Escape closes and returns focus", async () => {
  const user = userEvent.setup();
  render(
    <App>
      <ProductGallery
        image="/images/sakura-muse-dress.png"
        alt="Sample dress"
        name={dress.name}
      />
    </App>,
  );
  const trigger = screen.getByRole("button", {
    name: t("View full image of {name}", { name: dress.name }),
  });
  await user.click(trigger);
  assert.ok(screen.getByRole("dialog", { name: dress.name }));
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("dialog"), null);
  await waitFor(() => assert.equal(document.activeElement, trigger));
  assert.equal(routerCalls.length, 0);
});

test("image failure has an accessible fallback; changing source retries", () => {
  const view = render(
    <FashionImage
      src="/images/sakura-muse-dress.png"
      alt="Sample dress"
      width={200}
      height={300}
    />,
  );
  fireEvent.error(screen.getByRole("img", { name: "Sample dress" }));
  assert.ok(
    screen.getByRole("img", {
      name: "Sample dress. " + t("Image unavailable") + ".",
    }),
  );
  view.rerender(
    <FashionImage
      src="/images/sakura-luna-set.png"
      alt="Sample set"
      width={200}
      height={300}
    />,
  );
  assert.equal(screen.getByRole("img", { name: "Sample set" }).tagName, "IMG");
});

test("catalog applies combined local filters and chips without URL or history changes", async () => {
  const user = userEvent.setup();
  const initialUrl = window.location.href;
  const initialHistory = window.history.length;
  render(
    <App>
      <Catalog />
    </App>,
  );
  await user.type(await screen.findByRole("searchbox"), "  wedding guest  ");
  await user.click(await screen.findByText(t("Filters & sort")));
  await user.selectOptions(screen.getByLabelText(t("Category")), "Dresses");
  assert.ok(screen.getByRole("heading", { name: set.name }));
  await user.click(
    await screen.findByRole("button", { name: t("Apply filters") }),
  );
  assert.ok(screen.getByRole("heading", { name: dress.name }));
  assert.equal(screen.queryByRole("heading", { name: set.name }), null);
  await user.click(
    screen.getByRole("button", {
      name: t("Remove {label}: {value}", {
        label: t("Search"),
        value: "wedding guest",
      }),
    }),
  );
  assert.equal(screen.getByLabelText(t("Category")).value, "Dresses");
  assert.equal(
    document.activeElement,
    screen.getByRole("button", { name: t("Apply filters") }),
  );
  await user.click(screen.getByRole("button", { name: t("Clear filters") }));
  assert.ok(screen.getByRole("heading", { name: set.name }));
  assert.equal(
    screen.queryByRole("button", { name: t("Clear filters") }),
    null,
  );
  assert.equal(document.activeElement, screen.getByRole("searchbox"));
  assert.equal(routerCalls.length, 0);
  assert.equal(window.location.href, initialUrl);
  assert.equal(window.history.length, initialHistory);
});

test("catalog handles no matches and treats hostile input as text", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <App>
      <Catalog />
    </App>,
  );
  await user.type(
    await screen.findByRole("searchbox"),
    "<script>alert(1)</script>",
  );
  await user.click(
    await screen.findByRole("button", { name: t("Apply filters") }),
  );
  assert.ok(
    screen.getByRole("heading", { name: t("No looks match just yet.") }),
  );
  assert.ok(
    screen.getByRole("button", {
      name: t("Remove {label}: {value}", {
        label: t("Search"),
        value: "<script>alert(1)</script>",
      }),
    }),
  );
  assert.equal(container.querySelector("script"), null);
  assert.equal(
    screen.getAllByRole("button", { name: t("Clear filters") }).length,
    1,
  );
  assert.equal(routerCalls.length, 0);
});

test("local sort reorders results and remount starts with the default catalog", async () => {
  const user = userEvent.setup();
  const view = render(
    <App>
      <Catalog />
    </App>,
  );
  await user.click(await screen.findByText(t("Filters & sort")));
  await user.selectOptions(screen.getByLabelText(t("Sort by")), "price-asc");
  await user.click(
    await screen.findByRole("button", { name: t("Apply filters") }),
  );
  assert.deepEqual(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((item) => item.textContent),
    [top.name, set.name, dress.name],
  );
  view.unmount();
  render(
    <App>
      <Catalog />
    </App>,
  );
  await screen.findByRole("heading", { name: dress.name });
  assert.deepEqual(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((item) => item.textContent),
    [dress.name, set.name, top.name],
  );
  assert.equal(routerCalls.length, 0);
});

test("header marks the product business route active and exposes no feature URLs", async () => {
  await act(async () => {
    render(
      <App pathname="/products/muse-dress">
        <SiteHeader />
      </App>,
    );
  });
  const mainNav = screen.getByRole("navigation", {
    name: t("Main navigation"),
  });
  assert.equal(
    within(mainNav)
      .getByRole("link", { name: t("Rent clothing") })
      .getAttribute("aria-current"),
    "page",
  );
  assert.equal(
    within(mainNav)
      .getByRole("link", { name: t("Rent accessories") })
      .getAttribute("aria-current"),
    null,
  );
  for (const link of screen.getAllByRole("link"))
    assert.doesNotMatch(link.getAttribute("href"), /search|[?#]/);
});

test("mobile menu has one clothing link and Escape returns focus", async () => {
  const user = userEvent.setup();
  render(
    <App>
      <SiteHeader />
    </App>,
  );
  const trigger = screen.getByRole("button", {
    name: t("Open navigation menu"),
  });
  await user.click(trigger);
  const menu = screen.getByRole("navigation", { name: t("More navigation") });
  assert.equal(
    within(menu).getAllByRole("link", { name: t("Rent clothing") }).length,
    1,
  );
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("dialog"), null);
  await waitFor(() => assert.equal(document.activeElement, trigger));
});

test("reapplying the same catalog state does not create redundant navigation", async () => {
  const user = userEvent.setup();
  render(
    <App>
      <Catalog />
    </App>,
  );
  await user.click(
    await screen.findByRole("button", { name: t("Apply filters") }),
  );
  await user.click(
    await screen.findByRole("button", { name: t("Apply filters") }),
  );
  assert.equal(routerCalls.length, 0);
});

test("landing section action respects reduced motion and keeps the URL unchanged", async (context) => {
  const user = userEvent.setup();
  const calls = [];
  context.mock.method(window, "matchMedia", () => ({ matches: true }));
  render(
    <>
      <SectionButton target="rental-process">How it works</SectionButton>
      <section id="rental-process" tabIndex={-1}>
        Rental steps
      </section>
    </>,
  );
  const section = document.getElementById("rental-process");
  section.scrollIntoView = (options) => calls.push(options);
  const initialUrl = window.location.href;
  await user.click(screen.getByRole("button", { name: "How it works" }));
  assert.deepEqual(calls, [{ behavior: "instant", block: "start" }]);
  assert.equal(document.activeElement, section);
  assert.equal(window.location.href, initialUrl);
});

test("blocked storage preserves the action and clearly discloses its lifetime", async (context) => {
  context.mock.method(window.Storage.prototype, "setItem", () => {
    throw new Error("Quota unavailable");
  });
  const user = userEvent.setup();
  render(
    <App>
      <AddToBagButton slug="muse-dress" name={dress.name} />
    </App>,
  );
  await user.click(
    await screen.findByRole("button", { name: t("Add to rental bag") }),
  );
  assert.ok(
    screen.getByRole("button", { name: t("In your rental bag") }).disabled,
  );
  assert.match(
    screen.getByRole("status").textContent,
    new RegExp(
      t(
        " Device storage is unavailable; changes last for this visit only.",
      ).trim(),
    ),
  );
});
