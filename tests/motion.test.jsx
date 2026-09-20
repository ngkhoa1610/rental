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
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ScrollReveal } from "../src/components/ui/scroll-reveal.tsx";

afterEach(cleanup);

function installObserver(context, Observer) {
  for (const target of [window, globalThis]) {
    const previous = Object.getOwnPropertyDescriptor(
      target,
      "IntersectionObserver",
    );
    Object.defineProperty(target, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: Observer,
    });
    context.after(() => {
      if (previous)
        Object.defineProperty(target, "IntersectionObserver", previous);
      else delete target.IntersectionObserver;
    });
  }
}

test("server markup keeps content visible without JavaScript", () => {
  const html = renderToString(
    <ScrollReveal>
      <span>Explore</span>
    </ScrollReveal>,
  );
  assert.doesNotMatch(
    html,
    /data-reveal-state="pending"|opacity:0|visibility:hidden/,
  );
  assert.match(html, /Explore/);
});

test("offscreen keyboard focus reveals content and stops observing", (context) => {
  let disconnected = false;
  class Observer {
    observe() {}
    disconnect() {
      disconnected = true;
    }
  }
  installObserver(context, Observer);
  context.mock.method(HTMLElement.prototype, "getBoundingClientRect", () => ({
    top: 5000,
  }));
  const view = render(
    <ScrollReveal>
      <button>Reach me</button>
    </ScrollReveal>,
  );
  const reveal = view.container.firstElementChild;
  assert.equal(reveal.dataset.revealState, "pending");
  fireEvent.focusIn(screen.getByRole("button", { name: "Reach me" }));
  assert.equal(reveal.dataset.revealState, "visible");
  assert.ok(disconnected);
});

test("changing reduced-motion preference makes pending content visible", (context) => {
  let change;
  const motion = {
    matches: false,
    addEventListener: (_, listener) => {
      change = listener;
    },
    removeEventListener() {},
  };
  class Observer {
    observe() {}
    disconnect() {}
  }
  installObserver(context, Observer);
  context.mock.method(window, "matchMedia", () => motion);
  context.mock.method(HTMLElement.prototype, "getBoundingClientRect", () => ({
    top: 5000,
  }));
  const view = render(<ScrollReveal>Offscreen content</ScrollReveal>);
  assert.equal(view.container.firstElementChild.dataset.revealState, "pending");
  act(() => {
    motion.matches = true;
    change();
  });
  assert.equal(view.container.firstElementChild.dataset.revealState, "visible");
});

test("near-viewport content is never hidden during hydration", (context) => {
  class Observer {
    constructor() {
      throw new Error("Near content should not be observed");
    }
  }
  installObserver(context, Observer);
  context.mock.method(HTMLElement.prototype, "getBoundingClientRect", () => ({
    top: window.innerHeight + 20,
  }));
  const view = render(<ScrollReveal>Near viewport</ScrollReveal>);
  assert.equal(view.container.firstElementChild.dataset.revealState, "visible");
  assert.equal(
    view.container.firstElementChild.dataset.revealImmediate,
    "true",
  );
});

test("intersection reveals once, fast-scroll skips reveal immediately, and unmount cleans up", (context) => {
  const observers = [];
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.disconnections = 0;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnections += 1;
    }
  }
  installObserver(context, Observer);
  context.mock.method(HTMLElement.prototype, "getBoundingClientRect", () => ({
    top: 5000,
  }));
  const view = render(
    <>
      <ScrollReveal>First</ScrollReveal>
      <ScrollReveal>Second</ScrollReveal>
    </>,
  );
  const elements = view.container.children;
  act(() => observers[0].callback([{ isIntersecting: true }]));
  assert.equal(elements[0].dataset.revealState, "visible");
  assert.equal(observers[0].disconnections, 1);
  act(() =>
    observers[1].callback([
      { isIntersecting: false, boundingClientRect: { bottom: -20 } },
    ]),
  );
  assert.equal(elements[1].dataset.revealImmediate, "true");
  view.unmount();
  assert.ok(observers.every(({ disconnections }) => disconnections === 2));
});

test("initial reduced-motion preference bypasses pending state", (context) => {
  context.mock.method(window, "matchMedia", () => ({ matches: true }));
  context.mock.method(HTMLElement.prototype, "getBoundingClientRect", () => ({
    top: 5000,
  }));
  const view = render(<ScrollReveal>Always visible</ScrollReveal>);
  assert.equal(view.container.firstElementChild.dataset.revealState, "visible");
  assert.equal(
    view.container.firstElementChild.dataset.revealImmediate,
    "true",
  );
});
