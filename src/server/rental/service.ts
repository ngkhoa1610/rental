import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  ApiError,
  type RentalApi,
  type OperationName,
  type Input,
  type Output,
} from "@/lib/api/contracts";
import { filterProducts, normalizeCatalogFilters } from "@/lib/catalog";
import { monthDates } from "@/lib/rental-calendar";
import { serializable, lockProducts } from "@/server/db/transaction";
import { orderServices } from "./order-service";
import { adminServices } from "./admin-service";
import { adminReadServices } from "./admin-read-service";
import { authorize, audit, mutation } from "./unit-of-work";
import { parseInput } from "./input";
import { dateRange, allocations, peakOccupancy, requireStock } from "./stock";
import { mapCatalogProduct, mapQuote, mapOrder, mapReview } from "./mappers";
import { orderRelations } from "./prisma-repository";
import {
  pricingConfiguration,
  priceLines,
  type PricingConfiguration,
} from "./pricing";
import type { RentalServices, ServiceContext } from "./services";
/** All entrypoints validate runtime input and re-resolve current DB membership. */
export function createServiceApi(
  db: PrismaClient,
  context: ServiceContext,
  pricing: PricingConfiguration = pricingConfiguration(),
): RentalApi {
  const handlers: RentalServices = {
    ...orderServices(db, pricing),
    ...adminServices(db),
    "reviews.create": (input, ctx) =>
      mutation(db, "reviews.create", input, ctx, async (tx, actor) => {
        const order = await tx.rentalOrder.findFirst({
          where: {
            id: input.orderId,
            customerId: actor.userId,
            status: "completed",
          },
        });
        if (!order)
          throw new ApiError(
            "NOT_FOUND",
            "A completed rental of your own is required.",
          );
        if (await tx.customerReview.count({ where: { orderId: order.id } }))
          throw new ApiError("CONFLICT", "You already reviewed this rental.");
        const ids = [...new Set(input.mediaIds)];
        if (ids.length !== input.mediaIds.length)
          throw new ApiError("VALIDATION", "Duplicate photos are not allowed.");
        const assets = await tx.mediaAsset.findMany({
          where: {
            id: { in: ids },
            purpose: "review",
            ownerId: actor.userId,
            orderId: order.id,
            reviewLinks: { none: {} },
          },
        });
        if (assets.length !== ids.length)
          throw new ApiError(
            "FORBIDDEN",
            "Only your uploaded photos for this rental can be attached.",
          );
        const review = await tx.customerReview.create({
          data: {
            orderId: order.id,
            customerId: actor.userId,
            rating: input.rating,
            story: input.story,
            consentToPublish: input.consentToPublish,
            media: {
              create: ids.map((storageKey, position) => ({
                storageKey,
                position,
                alt: "Ảnh khách gửi sau thuê",
              })),
            },
          },
          include: { media: true },
        });
        await audit(
          tx,
          actor,
          "review",
          review.id,
          "Review submitted",
          "Awaiting moderation",
        );
        return mapReview(review);
      }),
    "catalog.list": async (input) =>
      filterProducts(
        (
          await db.product.findMany({
            where: { visibility: "published" },
            include: { images: true },
            orderBy: { createdAt: "asc" },
          })
        ).map(mapCatalogProduct),
        normalizeCatalogFilters(input),
      ),
    "catalog.get": async ({ slug }) => {
      const product = await db.product.findFirst({
        where: { slug, visibility: "published" },
        include: { images: true },
      });
      if (!product) throw new ApiError("NOT_FOUND", "Product not found.");
      return mapCatalogProduct(product);
    },
    "session.get": async (_, ctx) => {
      const actor = await authorize(db, "session.get", ctx);
      if (!actor) return { profile: null, csrfToken: null };
      const u = await db.user.findUniqueOrThrow({
        where: { id: actor.userId },
      });
      return {
        profile: {
          id: u.id,
          name: u.name ?? "",
          phone: u.phone,
          permissions: [...actor.permissions],
        },
        csrfToken: ctx.csrfToken ?? null,
      };
    },
    "session.logout": async (_, ctx) => {
      if (ctx.sessionId && ctx.principal)
        await db.session.deleteMany({
          where: {
            id: ctx.sessionId,
            userId: ctx.principal.userId,
            scope: ctx.scope,
          },
        });
    },
    "profile.update": async (input, ctx) =>
      serializable(db, async (tx) => {
        const actor = await authorize(tx, "profile.update", ctx);
        if (!actor)
          throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
        const u = await tx.user.update({
          where: { id: actor.userId },
          data: { name: input.name, phone: input.phone },
        });
        await audit(
          tx,
          actor,
          "profile",
          u.id,
          "Contact details saved",
          "Contact details updated",
        );
        return {
          id: u.id,
          name: u.name ?? "",
          phone: u.phone,
          permissions: [],
        };
      }),
    "availability.calendar": async (input) => {
      const dates = monthDates(input.month);
      const product = await db.product.findFirst({
        where: { slug: input.productSlug, visibility: "published" },
      });
      if (!product) throw new ApiError("NOT_FOUND", "Product not found.");
      if (!dates.length)
        throw new ApiError("VALIDATION", "Choose a valid calendar month.");
      const range = {
        pickupDate: new Date(dates[0] + "T00:00:00Z"),
        returnDate: new Date(dates[dates.length - 1] + "T00:00:00Z"),
      };
      const held = await allocations(db, [product.id], range);
      return {
        productSlug: product.slug,
        month: input.month,
        checkedAt: context.now.toISOString(),
        days: dates.map((date) => {
          const point = new Date(date + "T00:00:00Z");
          return {
            date,
            available: Math.max(
              0,
              product.quantity -
                peakOccupancy(held, { pickupDate: point, returnDate: point }),
            ),
          };
        }),
      };
    },
    "availability.quote": async (input, ctx) =>
      serializable(db, async (tx) => {
        const actor = await authorize(tx, "availability.quote", ctx);
        const range = dateRange(input, ctx.now);
        const slugs = input.items.map((i) => i.productSlug);
        if (new Set(slugs).size !== slugs.length)
          throw new ApiError(
            "VALIDATION",
            "Duplicate products are not allowed.",
          );
        const products = await tx.product.findMany({
          where: { slug: { in: slugs }, visibility: "published" },
        });
        if (products.length !== slugs.length)
          throw new ApiError("NOT_FOUND", "Product not found.");
        await lockProducts(
          tx,
          products.map((p) => p.id),
        );
        const lines = input.items.map((i) => {
          const p = products.find((p) => p.slug === i.productSlug);
          if (!p) throw new ApiError("NOT_FOUND", "Product not found.");
          return {
            ...p,
            productId: p.id,
            stock: p.quantity,
            quantity: i.quantity,
          };
        });
        await requireStock(tx, lines, range);
        const amounts = priceLines(lines, range, pricing);
        const held = await allocations(
          tx,
          products.map((p) => p.id),
          range,
        );
        return mapQuote(
          await tx.rentalQuote.create({
            data: {
              userId: actor?.userId,
              ...range,
              total: amounts.reduce((a, b) => a + b, 0),
              policyVersion: pricing.version,
              policyLabel: `Giá theo block niêm yết; ngày nhận và trả đều được tính. Chính sách ${pricing.version}. Chưa gồm cọc/phí chưa được xác nhận.`,
              expiresAt: new Date(ctx.now.getTime() + pricing.quoteTtlMs),
              lines: {
                create: lines.map((l, i) => ({
                  productId: l.id,
                  productSlug: l.slug,
                  name: l.name,
                  quantity: l.quantity,
                  amount: amounts[i],
                  available:
                    l.stock -
                    peakOccupancy(
                      held.filter((a) => a.productId === l.id),
                      range,
                    ),
                })),
              },
            },
            include: { lines: true },
          }),
        );
      }),
    "orders.list": async (_, ctx) =>
      (
        await db.rentalOrder.findMany({
          where: { customerId: ctx.principal?.userId ?? "" },
          include: orderRelations,
          orderBy: { createdAt: "desc" },
        })
      ).map(mapOrder),
    "orders.get": async (input, ctx) => {
      const order = await db.rentalOrder.findFirst({
        where: { id: input.orderId, customerId: ctx.principal?.userId ?? "" },
        include: orderRelations,
      });
      if (!order) throw new ApiError("NOT_FOUND", "Order not found.");
      return mapOrder(order);
    },
    ...adminReadServices(db),
  };
  return {
    async call<K extends OperationName>(
      op: K,
      input: Input<K>,
    ): Promise<Output<K>> {
      const valid = parseInput(op, input);
      await authorize(db, op, context);
      return handlers[op](valid, context);
    },
  };
}
