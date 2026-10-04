import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseRentalDate,
  rentalDateError,
  rentalToday,
} from "../src/lib/rental-dates.ts";

test("rental calendar rolls over at Vietnam midnight, independent of browser timezone", () => {
  assert.equal(rentalToday(Date.parse("2030-01-01T16:59:59Z")), "2030-01-01");
  assert.equal(rentalToday(Date.parse("2030-01-01T17:00:00Z")), "2030-01-02");
  for (const value of [
    "",
    "2030-2-01",
    "2030-02-29",
    "2030-02-30",
    "2030-01-01T00:00:00Z",
  ])
    assert.equal(parseRentalDate(value), null, value);
  assert.ok(parseRentalDate("2032-02-29"));
});

test("today, same-day and next-day dates pass; past pickup and reversed ranges fail", () => {
  const now = Date.parse("2030-01-01T17:00:00Z");
  for (const returnDate of ["2030-01-02", "2030-01-03"])
    assert.equal(
      rentalDateError({ pickupDate: "2030-01-02", returnDate }, now),
      null,
    );
  assert.match(
    rentalDateError(
      { pickupDate: "2030-01-01", returnDate: "2030-01-02" },
      now,
    ),
    /past/,
  );
  assert.match(
    rentalDateError(
      { pickupDate: "2030-01-03", returnDate: "2030-01-02" },
      now,
    ),
    /before pickup/,
  );
});
