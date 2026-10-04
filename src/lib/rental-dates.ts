/** Rental calendar dates use the store's Vietnam timezone, not the browser's UTC day. */
export function rentalToday(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function parseRentalDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? time
    : null;
}

export function rentalDateError(
  dates: { pickupDate: string; returnDate: string },
  now = Date.now(),
): string | null {
  const pickup = parseRentalDate(dates.pickupDate);
  const returned = parseRentalDate(dates.returnDate);
  if (pickup === null || returned === null)
    return "Enter valid pickup and return dates.";
  if (dates.pickupDate < rentalToday(now))
    return "Pickup date cannot be in the past.";
  if (returned < pickup) return "Return date cannot be before pickup.";
  return null;
}
