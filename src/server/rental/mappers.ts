import {
  ApiError,
  type ManagedProduct,
  type PaymentSummary,
  type Quote,
  type RentalOrder,
  type EditorialContent,
  type CustomerReview,
  type StaffMember,
} from "@/lib/api/contracts";
import { categories, occasions } from "@/lib/catalog";
import { permissionNames } from "@/server/auth/policy";
import type {
  ProductRecord,
  QuoteRecord,
  OrderRecord,
  EditorialRecord,
  ReviewRecord,
  StaffRecord,
} from "./models";

export const rentalDate = (date: Date): string =>
  date.toISOString().slice(0, 10);
export function mapProduct(record: ProductRecord): ManagedProduct {
  const category = categories.find((value) => value === record.category);
  const acceptedOccasions = record.occasions.map((value) =>
    occasions.find((option) => option === value),
  );
  const [image, ...additionalPhotos] = record.images.toSorted(
    (a, b) => a.position - b.position,
  );
  if (!category || !image || acceptedOccasions.some((value) => !value))
    throw new ApiError(
      "INVALID_RESPONSE",
      "Product data is not ready for the storefront.",
    );
  return {
    slug: record.slug,
    name: record.name,
    description: record.description,
    category,
    collection: record.collection,
    occasions: acceptedOccasions.filter((value) => value !== undefined),
    price: record.price,
    rentalDays: record.rentalDays,
    image: image.url,
    imageAlt: image.alt,
    additionalPhotos: additionalPhotos.map(({ url, alt }) => ({ url, alt })),
    quantity: record.quantity,
    visibility: record.visibility,
    version: record.version,
  };
}
function mapLine(
  line: QuoteRecord["lines"][number] | OrderRecord["lines"][number],
) {
  return {
    productSlug: line.productSlug,
    name: line.name,
    quantity: line.quantity,
    amount: line.amount,
    available: line.available,
  };
}
export function mapQuote(record: QuoteRecord): Quote {
  if (record.currency !== "VND")
    throw new ApiError("INVALID_RESPONSE", "Unsupported currency.");
  return {
    id: record.id,
    pickupDate: rentalDate(record.pickupDate),
    returnDate: rentalDate(record.returnDate),
    total: record.total,
    currency: "VND",
    policyLabel: record.policyLabel,
    expiresAt: record.expiresAt.toISOString(),
    lines: record.lines.map(mapLine),
  };
}
export function summarizePayments(
  due: number,
  entries: OrderRecord["payments"],
): PaymentSummary {
  const collected = entries
    .filter((e) => e.kind === "collection")
    .reduce((total, e) => total + e.amount, 0);
  const refunded = entries
    .filter((e) => e.kind === "refund")
    .reduce((total, e) => total + e.amount, 0);
  const net = collected - refunded;
  if (
    ![due, collected, refunded].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    net < 0 ||
    net > due
  )
    throw new ApiError(
      "INVALID_RESPONSE",
      "The payment ledger is inconsistent.",
    );
  return {
    due,
    collected,
    refunded,
    remaining: due - net,
    status: net === 0 ? "unpaid" : net === due ? "paid" : "partial",
  };
}
export function mapOrder(record: OrderRecord): RentalOrder {
  return {
    id: record.id,
    customerId: record.customerId,
    ...(record.reviews?.[0] ? { review: mapReview(record.reviews[0]) } : {}),
    contact: { name: record.contactName, phone: record.contactPhone },
    pickupDate: rentalDate(record.pickupDate),
    returnDate: rentalDate(record.returnDate),
    notes: record.notes,
    status: record.status,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    lines: record.lines.map(mapLine),
    history: record.audits.map((e) => ({
      actorId: e.actorId,
      at: e.createdAt.toISOString(),
      action: e.action,
      note: e.note,
    })),
  };
}
export function mapContent(record: EditorialRecord): EditorialContent {
  return {
    id: record.id,
    kind: record.kind,
    title: record.title,
    body: record.body,
    visibility: record.visibility,
    version: record.version,
    productSlugs: record.products
      .toSorted((a, b) => a.position - b.position)
      .map((link) => link.product.slug),
  };
}
export function mapReview(record: ReviewRecord): CustomerReview {
  return {
    id: record.id,
    orderId: record.orderId,
    rating: record.rating,
    story: record.story,
    consentToPublish: record.consentToPublish,
    moderation: record.moderation,
    moderationNote: record.moderationNote,
    version: record.version,
    mediaIds: record.media.map((media) => media.storageKey),
  };
}
export function mapStaff(record: StaffRecord): StaffMember {
  return {
    id: record.userId,
    name: record.user.name ?? "",
    phone: record.user.phone,
    active: record.active && record.user.active,
    version: record.version,
    permissions: record.permissions.map(
      (permission) => permissionNames[permission],
    ),
  };
}

export function mapCatalogProduct(record: ProductRecord) {
  const p = mapProduct(record);
  return {
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    collection: p.collection,
    occasions: p.occasions,
    price: p.price,
    rentalDays: p.rentalDays,
    image: p.image,
    imageAlt: p.imageAlt,
  };
}
