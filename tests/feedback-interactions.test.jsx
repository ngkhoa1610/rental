import "./dom-setup.mjs";
import React from "react";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackWall } from "../src/components/store/feedback-wall.tsx";

afterEach(cleanup);
function browserProperty(context, key, value) {
  const previous = Object.getOwnPropertyDescriptor(navigator, key);
  Object.defineProperty(navigator, key, { configurable: true, value });
  context.after(() => {
    if (previous) Object.defineProperty(navigator, key, previous);
    else delete navigator[key];
  });
}
const shareName = "Share illustrative feedback by Mai";

test("feedback composer validates, previews escaped text locally, and restores focus", async () => {
  const user = userEvent.setup();
  const url = window.location.href;
  const history = window.history.length;
  render(<FeedbackWall />);
  await user.click(
    screen.getByRole("button", { name: "Your words belong here" }),
  );
  const dialog = screen.getByRole("dialog");
  await user.click(
    within(dialog).getByRole("button", { name: "Preview my feedback" }),
  );
  assert.match(screen.getByRole("alert").textContent, /Add a name/);
  await user.type(screen.getByLabelText("Your name"), "  Sam  ");
  fireEvent.change(screen.getByLabelText("Your story"), {
    target: { value: '<script>alert("hi")</script>' },
  });
  await user.click(screen.getByRole("radio", { name: "4 out of 5 stars" }));
  await user.click(screen.getByRole("button", { name: "Preview my feedback" }));
  const region = screen.getByRole("region", { name: "Your private preview" });
  assert.ok(within(region).getByText('“<script>alert("hi")</script>”'));
  assert.equal(region.querySelector("script"), null);
  assert.ok(within(region).getByLabelText("4 out of 5 stars"));
  assert.equal(screen.queryByRole("dialog"), null);
  await waitFor(() =>
    assert.equal(
      document.activeElement,
      screen.getByRole("heading", { name: "Your private preview" }),
    ),
  );
  assert.equal(window.location.href, url);
  assert.equal(window.history.length, history);
});

test("cancel keeps the draft for this visit and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const view = render(<FeedbackWall />);
  const trigger = screen.getByRole("button", {
    name: "Your words belong here",
  });
  await user.click(trigger);
  await user.type(screen.getByLabelText("Your name"), "Linh");
  await user.keyboard("{Escape}");
  await waitFor(() => assert.equal(document.activeElement, trigger));
  await user.click(trigger);
  assert.equal(screen.getByLabelText("Your name").value, "Linh");
  view.unmount();
  render(<FeedbackWall />);
  await user.click(
    screen.getByRole("button", { name: "Your words belong here" }),
  );
  assert.equal(screen.getByLabelText("Your name").value, "");
});

test("share falls back to clipboard and preserves the sample label", async (context) => {
  const user = userEvent.setup();
  const copied = [];
  browserProperty(context, "share", undefined);
  browserProperty(context, "clipboard", {
    writeText: async (text) => copied.push(text),
  });
  render(<FeedbackWall />);
  await user.click(screen.getByRole("button", { name: shareName }));
  assert.equal(copied.length, 1);
  assert.match(
    copied[0],
    /Illustrative feedback — not a verified customer review/,
  );
  assert.ok(screen.getByText("Feedback copied. Paste it wherever you like."));
});

test("native share cancellation never silently copies content", async (context) => {
  const user = userEvent.setup();
  let copied = false;
  browserProperty(context, "share", async () => {
    throw new DOMException("Cancelled", "AbortError");
  });
  browserProperty(context, "clipboard", {
    writeText: async () => {
      copied = true;
    },
  });
  render(<FeedbackWall />);
  await user.click(screen.getByRole("button", { name: shareName }));
  assert.ok(screen.getByText("Sharing cancelled."));
  assert.equal(copied, false);
});

test("native share receives only the selected story and prevents repeat clicks while pending", async (context) => {
  const user = userEvent.setup();
  let complete;
  const calls = [];
  browserProperty(context, "share", (data) => {
    calls.push(data);
    return new Promise((resolve) => {
      complete = resolve;
    });
  });
  render(<FeedbackWall />);
  const button = screen.getByRole("button", { name: shareName });
  await user.click(button);
  assert.ok(button.disabled);
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /Mai/);
  assert.equal(calls[0].url, undefined);
  complete();
  await waitFor(() => assert.equal(button.disabled, false));
  assert.ok(screen.getByText("Share request completed."));
});

test("unsupported or rejected sharing exposes a selectable manual fallback", async (context) => {
  const user = userEvent.setup();
  browserProperty(context, "share", async () => {
    throw new Error("Unavailable");
  });
  browserProperty(context, "clipboard", {
    writeText: async () => {
      throw new Error("Denied");
    },
  });
  render(<FeedbackWall />);
  await user.click(screen.getByRole("button", { name: shareName }));
  const text = screen.getByLabelText("Text to copy");
  assert.ok(text.readOnly);
  assert.match(text.value, /Illustrative feedback/);
  await waitFor(() =>
    assert.ok(
      document.activeElement === text,
      "Manual copy field should receive focus",
    ),
  );
  assert.equal(text.selectionEnd, text.value.length);
  assert.equal(
    screen.queryByText("Feedback copied. Paste it wherever you like."),
    null,
  );
});
