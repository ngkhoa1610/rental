import assert from "node:assert/strict";
import { test } from "node:test";
import {
  sampleFeedback,
  validateFeedback,
  feedbackShareText,
} from "../src/lib/feedback.ts";
import { getProduct } from "../src/lib/catalog.ts";

const valid = {
  name: "Mai",
  quote: "I enjoyed trying this outfit.",
  rating: "5",
};
test("feedback examples have unique IDs and reference existing styling assets", () => {
  assert.equal(
    new Set(sampleFeedback.map(({ id }) => id)).size,
    sampleFeedback.length,
  );
  for (const item of sampleFeedback) {
    assert.equal(
      validateFeedback({ ...item, rating: String(item.rating) }),
      null,
    );
    if (item.productSlug) assert.ok(getProduct(item.productSlug));
  }
});
test("feedback rejects blank identity and whitespace-only or oversized stories", () => {
  for (const name of ["   ", "a".repeat(41)])
    assert.ok(validateFeedback({ ...valid, name }));
  for (const quote of [" ".repeat(30), "short", "x".repeat(501)])
    assert.ok(validateFeedback({ ...valid, quote }));
  assert.equal(validateFeedback({ ...valid, quote: "x".repeat(500) }), null);
});
test("feedback only accepts integral ratings 1 through 5", () => {
  for (const rating of ["0", "6", "1.5", "NaN", "", "__proto__"])
    assert.ok(validateFeedback({ ...valid, rating }));
  for (const rating of ["1", "2", "3", "4", "5"])
    assert.equal(validateFeedback({ ...valid, rating }), null);
});
test("shared samples retain the illustrative label outside the page", () => {
  const text = feedbackShareText(sampleFeedback[0], true);
  assert.match(text, /Illustrative feedback — not a verified customer review/);
  assert.match(text, /Mai · 5\/5/);
});
test("private feedback sharing is text only and never claims publication", () => {
  const text = feedbackShareText({
    name: "A&B",
    quote: '<script>alert("test")</script>',
    rating: 4,
  });
  assert.match(text, /My feedback draft — not published/);
  assert.ok(text.includes('<script>alert("test")</script>'));
  assert.doesNotMatch(text, /https?:|\?quote=/);
});
