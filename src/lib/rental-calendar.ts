import { parseRentalDate } from "./rental-dates";

/** A bounded month read; no booking/price/variant policy lives in this helper. */
export function monthDates(month: string): string[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
  const year = Number(month.slice(0, 4));
  if (year < 2000 || year > 2100) return [];
  const count = new Date(
    Date.UTC(year, Number(month.slice(5)), 0),
  ).getUTCDate();
  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}
export function shiftMonth(month: string, offset: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function rangeDates(start: string, end: string): string[] {
  const a = parseRentalDate(start),
    b = parseRentalDate(end);
  if (a === null || b === null || b < a || b - a > 366 * 86400000) return [];
  return Array.from({ length: (b - a) / 86400000 + 1 }, (_, i) =>
    new Date(a + i * 86400000).toISOString().slice(0, 10),
  );
}
