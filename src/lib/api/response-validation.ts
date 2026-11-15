import { monthDates } from "../rental-calendar";
import { permissions } from "../access";
import { ApiError, type OperationName } from "./contracts";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string";
const money = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const list = (value: unknown, check: (item: unknown) => boolean) =>
  Array.isArray(value) && value.every(check);
const fields = (value: RecordValue, keys: string[]) =>
  keys.every((key) => text(value[key]));
const dates = (value: RecordValue) =>
  fields(value, ["pickupDate", "returnDate"]);
const profile = (value: unknown) =>
  record(value) &&
  fields(value, ["id", "name", "phone"]) &&
  list(value.permissions, (permission) =>
    permissions.some((value) => value === permission),
  );
const product = (value: unknown) =>
  record(value) &&
  fields(value, [
    "slug",
    "name",
    "category",
    "collection",
    "image",
    "imageAlt",
    "description",
  ]) &&
  list(value.occasions, text) &&
  money(value.price) &&
  money(value.rentalDays);
const line = (value: unknown) =>
  record(value) &&
  fields(value, ["productSlug", "name"]) &&
  money(value.quantity) &&
  money(value.amount) &&
  money(value.available);
const quote = (value: unknown) =>
  record(value) &&
  fields(value, ["id", "expiresAt", "policyLabel"]) &&
  dates(value) &&
  value.currency === "VND" &&
  money(value.total) &&
  list(value.lines, line);
const payment = (value: unknown) =>
  record(value) &&
  ["due", "collected", "refunded", "remaining"].every((key) =>
    money(value[key]),
  ) &&
  ["unpaid", "partial", "paid"].includes(String(value.status));
const order = (value: unknown) =>
  record(value) &&
  fields(value, ["id", "customerId", "notes", "createdAt"]) &&
  dates(value) &&
  money(value.version) &&
  [
    "pending",
    "confirmed",
    "renting",
    "returned",
    "completed",
    "rejected",
    "cancelled",
  ].includes(String(value.status)) &&
  record(value.contact) &&
  fields(value.contact, ["name", "phone"]) &&
  list(value.lines, line) &&
  (value.payment === undefined || payment(value.payment)) &&
  (value.review === undefined || review(value.review)) &&
  (value.payments === undefined ||
    list(
      value.payments,
      (entry) =>
        record(entry) &&
        fields(entry, ["id", "occurredAt", "note", "actorId"]) &&
        ["collection", "refund"].includes(String(entry.kind)) &&
        money(entry.amount),
    )) &&
  (value.changes === undefined ||
    list(
      value.changes,
      (entry) =>
        record(entry) &&
        fields(entry, ["id", "reason"]) &&
        dates(entry) &&
        ["dates", "cancel"].includes(String(entry.kind)) &&
        ["pending", "accepted", "rejected"].includes(String(entry.status)),
    )) &&
  list(
    value.history,
    (entry) =>
      record(entry) && fields(entry, ["actorId", "at", "action", "note"]),
  );

const managedProduct = (value: unknown) =>
  record(value) &&
  product(value) &&
  money(value.quantity) &&
  money(value.version) &&
  ["draft", "published"].includes(String(value.visibility));
const block = (value: unknown) =>
  record(value) &&
  fields(value, ["id", "productSlug", "reason"]) &&
  dates(value) &&
  money(value.quantity) &&
  money(value.version);
const editorial = (value: unknown) =>
  record(value) &&
  fields(value, ["id", "title", "body"]) &&
  ["collection", "lookbook"].includes(String(value.kind)) &&
  ["draft", "published"].includes(String(value.visibility)) &&
  list(value.productSlugs, text) &&
  money(value.version);
const review = (value: unknown) =>
  record(value) &&
  fields(value, ["id", "orderId", "story", "moderationNote"]) &&
  money(value.version) &&
  typeof value.rating === "number" &&
  Number.isInteger(value.rating) &&
  value.rating >= 1 &&
  value.rating <= 5 &&
  typeof value.consentToPublish === "boolean" &&
  list(value.mediaIds, text) &&
  ["pending", "approved", "rejected"].includes(String(value.moderation));
const member = (value: unknown) =>
  record(value) &&
  profile(value) &&
  typeof value.active === "boolean" &&
  money(value.version);

/** Validate external data before the typed boundary; React escapes all displayed text. */
export function assertApiOutput(
  operation: OperationName,
  value: unknown,
): void {
  let valid: boolean;
  switch (operation) {
    case "admin.products.list":
      valid = list(value, managedProduct);
      break;
    case "admin.products.save":
      valid = managedProduct(value);
      break;
    case "admin.availability.list":
      valid = list(value, block);
      break;
    case "admin.availability.save":
      valid = block(value);
      break;
    case "admin.availability.remove":
      valid = value === undefined || value === null;
      break;
    case "admin.customers.list":
      valid = list(value, profile);
      break;
    case "admin.content.list":
      valid = list(value, editorial);
      break;
    case "admin.content.save":
      valid = editorial(value);
      break;
    case "admin.reviews.list":
      valid = list(value, review);
      break;
    case "reviews.create":
    case "admin.reviews.moderate":
      valid = review(value);
      break;
    case "admin.staff.list":
      valid = list(value, member);
      break;
    case "admin.staff.update":
      valid = member(value);
      break;
    case "session.get":
      valid =
        record(value) &&
        (value.profile === null || profile(value.profile)) &&
        (value.csrfToken === null || text(value.csrfToken));
      break;
    case "session.logout":
      valid = value === null || value === undefined;
      break;
    case "profile.update":
      valid = profile(value);
      break;
    case "catalog.list":
      valid = list(value, product);
      break;
    case "catalog.get":
      valid = product(value);
      break;
    case "availability.calendar": {
      const expected =
        record(value) && text(value.month)
          ? monthDates(String(value.month))
          : [];
      valid =
        record(value) &&
        fields(value, ["productSlug", "month", "checkedAt"]) &&
        Number.isFinite(Date.parse(String(value.checkedAt))) &&
        expected.length > 0 &&
        Array.isArray(value.days) &&
        value.days.length === expected.length &&
        value.days.every(
          (day, i) =>
            record(day) && day.date === expected[i] && money(day.available),
        );
      break;
    }
    case "availability.quote":
      valid = quote(value);
      break;
    case "orders.list":
    case "admin.payments.list":
    case "admin.orders.list":
      valid = list(value, order);
      break;
    default:
      valid = order(value);
  }
  if (!valid)
    throw new ApiError(
      "INVALID_RESPONSE",
      "The service response does not match the rental API contract.",
    );
}
