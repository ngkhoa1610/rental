import { z } from "zod";
import { ApiError, type Input, type OperationName } from "@/lib/api/contracts";
import { categories, occasions } from "@/lib/catalog";
import { permissions } from "@/lib/access";
const text = (max: number) => z.string().trim().min(1).max(max);
const id = text(128);
const slug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const version = z.number().int().min(0).max(2147483646);
const money = z.number().int().positive().max(2147483647);
const note = text(1000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dates = { pickupDate: date, returnDate: date };
const mutation = { idempotencyKey: id };
const order = { ...mutation, orderId: id, version: version.min(1) };
const visibility = z.enum(["draft", "published"]);
const empty = z
  .union([z.undefined(), z.strictObject({})])
  .transform(() => undefined);
const image = z
  .string()
  .max(240)
  .regex(
    /^\/(?:images\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)|media\/[a-zA-Z0-9_-]+)$/,
  );
export const inputSchemas = {
  "reviews.create": z.strictObject({
    ...mutation,
    orderId: id,
    rating: z.number().int().min(1).max(5),
    story: text(2000),
    consentToPublish: z.boolean(),
    mediaIds: z.array(id).max(3),
  }),
  "catalog.list": z.strictObject({
    query: z.string().max(100).optional(),
    category: z.string().max(80).optional(),
    occasion: z.string().max(80).optional(),
    collection: z.string().max(100).optional(),
    sort: z.enum(["featured", "price-asc", "price-desc"]).optional(),
  }),
  "catalog.get": z.strictObject({ slug }),
  "session.get": empty,
  "session.logout": empty,
  "profile.update": z.strictObject({
    name: text(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d ()-]{8,20}$/),
  }),
  "availability.calendar": z.strictObject({
    productSlug: slug,
    month: z.string().regex(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/),
  }),
  "availability.quote": z.strictObject({
    ...dates,
    items: z
      .array(
        z.strictObject({
          productSlug: slug,
          quantity: z.number().int().min(1).max(100),
        }),
      )
      .min(1)
      .max(100),
  }),
  "orders.create": z.strictObject({
    ...mutation,
    quoteId: id,
    notes: z.string().trim().max(1000),
  }),
  "orders.list": empty,
  "orders.get": z.strictObject({ orderId: id }),
  "orders.change": z.strictObject({
    ...order,
    kind: z.enum(["dates", "cancel"]),
    dates: z.strictObject(dates).optional(),
    reason: note,
  }),
  "admin.products.list": empty,
  "admin.products.save": z.strictObject({
    ...mutation,
    product: z.strictObject({
      slug,
      version,
      name: text(100),
      description: text(1000),
      category: z.enum(categories),
      collection: text(100),
      occasions: z.array(z.enum(occasions)).max(5),
      price: money,
      rentalDays: z.number().int().min(1).max(366),
      quantity: z.number().int().min(0).max(100),
      visibility,
      image,
      imageAlt: text(200),
    }),
  }),
  "admin.availability.list": empty,
  "admin.availability.save": z.strictObject({
    ...mutation,
    block: z.strictObject({
      ...dates,
      id: z.string().max(128),
      productSlug: slug,
      version,
      quantity: z.number().int().min(1).max(100),
      reason: note,
    }),
  }),
  "admin.availability.remove": z.strictObject({
    ...mutation,
    id,
    version: version.min(1),
  }),
  "admin.customers.list": empty,
  "admin.content.list": empty,
  "admin.content.save": z.strictObject({
    ...mutation,
    content: z.strictObject({
      id: z.string().max(128),
      version,
      kind: z.enum(["collection", "lookbook"]),
      title: text(100),
      body: text(4000),
      productSlugs: z.array(slug).min(1).max(100),
      visibility,
    }),
  }),
  "admin.reviews.list": empty,
  "admin.reviews.moderate": z.strictObject({
    ...mutation,
    id,
    version: version.min(1),
    decision: z.enum(["approved", "rejected"]),
    note,
  }),
  "admin.staff.list": empty,
  "admin.staff.update": z.strictObject({
    ...mutation,
    id,
    version: version.min(1),
    active: z.boolean(),
    permissions: z
      .array(
        z.enum(
          permissions as [
            (typeof permissions)[number],
            ...(typeof permissions)[number][],
          ],
        ),
      )
      .max(8),
  }),
  "admin.payments.list": empty,
  "admin.orders.list": empty,
  "admin.orders.transition": z.strictObject({
    ...order,
    status: z.enum([
      "pending",
      "confirmed",
      "renting",
      "returned",
      "completed",
      "rejected",
      "cancelled",
    ]),
    note,
  }),
  "admin.orders.resolve": z.strictObject({
    ...order,
    changeId: id,
    decision: z.enum(["accepted", "rejected"]),
    note,
  }),
  "admin.payments.record": z.strictObject({
    ...order,
    kind: z.enum(["collection", "refund"]),
    amount: money,
    occurredAt: z.iso.datetime({ offset: true }),
    note,
  }),
} satisfies Record<OperationName, z.ZodType>;
export function parseInput<K extends OperationName>(
  operation: K,
  input: unknown,
): Input<K> {
  const result = inputSchemas[operation].safeParse(input);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues)
      fields[issue.path.join(".") || "form"] = "Check this value.";
    throw new ApiError(
      "VALIDATION",
      "Please check the highlighted fields.",
      fields,
      400,
    );
  }
  return result.data as Input<K>;
}
