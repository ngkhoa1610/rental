import "./dom-setup.mjs";
import React from "react";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LookbookPage from "../src/app/(store)/lookbook/page.tsx";

afterEach(cleanup);

test("lookbook occasion shortcuts focus the matching outfit without URL or history changes", async () => {
  const user = userEvent.setup();
  const url = window.location.href;
  const history = window.history.length;
  render(<LookbookPage />);
  const shortcuts = screen.getByRole("group", {
    name: "Jump to an outfit idea",
  });
  const outfits = [
    ["Date night", "A reason to dress up.", "muse-dress", "Muse Dress"],
    ["Vacation", "Take the scenic route.", "luna-set", "Luna Set"],
    ["Weekend", "No special occasion needed.", "soleil-top", "Soleil Top"],
  ];

  for (const [occasion, title, slug, name] of outfits) {
    const heading = screen.getByRole("heading", { name: title });
    const calls = [];
    heading.scrollIntoView = (options) => calls.push(options);
    await user.click(within(shortcuts).getByRole("button", { name: occasion }));
    assert.deepEqual(calls, [{ behavior: "smooth", block: "start" }]);
    assert.ok(document.activeElement === heading);
    const story = screen.getByRole("article", { name: title });
    const link = within(story).getByRole("link", { name: `Explore ${name}` });
    assert.equal(link.getAttribute("href"), `/products/${slug}`);
    assert.equal(within(story).getAllByRole("link").length, 1);
  }
  assert.equal(window.location.href, url);
  assert.equal(window.history.length, history);
});

test("keyboard occasion shortcut respects reduced motion and moves focus to the story", async (context) => {
  context.mock.method(window, "matchMedia", (query) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    addEventListener() {},
    removeEventListener() {},
  }));
  const user = userEvent.setup();
  render(<LookbookPage />);
  const heading = screen.getByRole("heading", {
    name: "Take the scenic route.",
  });
  const calls = [];
  heading.scrollIntoView = (options) => calls.push(options);
  screen.getByRole("button", { name: "Vacation" }).focus();
  await user.keyboard("{Enter}");
  assert.deepEqual(calls, [{ behavior: "instant", block: "start" }]);
  assert.ok(document.activeElement === heading);
});
