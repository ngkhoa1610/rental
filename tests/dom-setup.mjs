import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/products",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "self",
  "FormData",
  "HTMLFormElement",
  "document",
  "navigator",
  "localStorage",
  "Node",
  "NodeFilter",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "DocumentFragment",
  "MutationObserver",
  "CustomEvent",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "DOMRect",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: dom.window[key],
  });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
});
// DOM tests deliberately do not claim layout, intersection or browser coverage.
