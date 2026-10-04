import "server-only";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  ApiError,
  type OrderMutation,
  type OperationName,
} from "@/lib/api/contracts";
import { orderTransitions, orderStatusLabels } from "@/lib/order-workflow";
import { lockProducts } from "@/server/db/transaction";
import type { Principal } from "@/server/auth/policy";
import type { RentalServices, ServiceContext } from "./services";
import { audit, mutation, requireVersion } from "./unit-of-work";
import { orderRelations } from "./prisma-repository";
import { mapOrder, rentalDate, summarizePayments } from "./mappers";
import { dateRange, requireStock } from "./stock";
import { priceLines, type PricingConfiguration } from "./pricing";
import type { OrderRecord } from "./models";
export function orderServices(
  db: PrismaClient,
  pricing: PricingConfiguration,
): Pick<
  RentalServices,
  | "orders.create"
  | "orders.change"
  | "admin.orders.transition"
  | "admin.orders.resolve"
  | "admin.payments.record"
> {
  async function modify(
    input: OrderMutation,
    op: OperationName,
    ctx: ServiceContext,
    work: (
      tx: Prisma.TransactionClient,
      actor: Principal,
      order: OrderRecord,
    ) => Promise<void>,
  ) {
    return mutation(db, op, input, ctx, async (tx, actor) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM "RentalOrder" WHERE id=${input.orderId} FOR UPDATE`,
      );
      const order = await tx.rentalOrder.findFirst({
        where: {
          id: input.orderId,
          ...(actor.scope === "customer" ? { customerId: actor.userId } : {}),
        },
        include: orderRelations,
      });
      if (!order) throw new ApiError("NOT_FOUND", "Order not found.");
      requireVersion(order, input.version);
      await lockProducts(
        tx,
        order.lines.map((l) => l.productId),
      );
      await work(tx, actor, order);
      return mapOrder(
        await tx.rentalOrder.update({
          where: { id: order.id, version: input.version },
          data: { version: { increment: 1 } },
          include: orderRelations,
        }),
      );
    });
  }
  return {
    "orders.create": (input, ctx) =>
      mutation(db, "orders.create", input, ctx, async (tx, actor) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: actor.userId },
        });
        if (!user.name?.trim() || !/^\+?[\d ()-]{8,20}$/.test(user.phone))
          throw new ApiError(
            "VALIDATION",
            "Complete your name and phone in your profile first.",
          );
        const quote = await tx.rentalQuote.findFirst({
          where: { id: input.quoteId, userId: actor.userId },
          include: { lines: true, order: { select: { id: true } } },
        });
        if (!quote)
          throw new ApiError(
            "NOT_FOUND",
            "Quote not found. Check availability again.",
          );
        if (quote.order)
          throw new ApiError(
            "CONFLICT",
            "This quote already belongs to an order.",
          );
        if (quote.expiresAt <= ctx.now)
          throw new ApiError(
            "QUOTE_EXPIRED",
            "Your quote expired. Check availability again.",
          );
        const range = dateRange(
          {
            pickupDate: rentalDate(quote.pickupDate),
            returnDate: rentalDate(quote.returnDate),
          },
          ctx.now,
        );
        await lockProducts(
          tx,
          quote.lines.map((l) => l.productId),
        );
        const active = await tx.product.count({
          where: {
            id: { in: quote.lines.map((l) => l.productId) },
            visibility: "published",
          },
        });
        if (active !== quote.lines.length)
          throw new ApiError(
            "UNAVAILABLE",
            "Some products are no longer offered. Check availability again.",
          );
        if (quote.policyVersion !== pricing.version || !pricing.mode)
          throw new ApiError(
            "QUOTE_EXPIRED",
            "The pricing policy changed. Check availability again.",
          );
        await requireStock(tx, quote.lines, range);
        const order = await tx.rentalOrder.create({
          data: {
            customerId: actor.userId,
            quoteId: quote.id,
            contactName: user.name,
            contactPhone: user.phone,
            ...range,
            total: quote.total,
            notes: input.notes,
            lines: {
              create: quote.lines.map((l) => ({
                productId: l.productId,
                productSlug: l.productSlug,
                name: l.name,
                quantity: l.quantity,
                amount: l.amount,
                available: l.available,
              })),
            },
          },
          include: orderRelations,
        });
        await audit(
          tx,
          actor,
          "order",
          order.id,
          "Request submitted",
          "Pending approval; no reservation or payment.",
          order.id,
        );
        return mapOrder(
          await tx.rentalOrder.findUniqueOrThrow({
            where: { id: order.id },
            include: orderRelations,
          }),
        );
      }),
    "orders.change": (input, ctx) =>
      modify(input, "orders.change", ctx, async (tx, actor, order) => {
        if (
          !["pending", "confirmed"].includes(order.status) ||
          order.changes.some((c) => c.status === "pending")
        )
          throw new ApiError(
            "CONFLICT",
            "This order already has a pending change or no longer accepts changes.",
          );
        const range =
          input.kind === "dates" && input.dates
            ? dateRange(input.dates, ctx.now)
            : { pickupDate: order.pickupDate, returnDate: order.returnDate };
        if (input.kind === "dates" && !input.dates)
          throw new ApiError("VALIDATION", "Choose new dates.");
        await tx.orderChange.create({
          data: {
            orderId: order.id,
            kind: input.kind,
            ...range,
            reason: input.reason,
          },
        });
        await audit(
          tx,
          actor,
          "order",
          order.id,
          "Change requested",
          input.reason,
          order.id,
        );
      }),
    "admin.orders.transition": (input, ctx) =>
      modify(
        input,
        "admin.orders.transition",
        ctx,
        async (tx, actor, order) => {
          if (!orderTransitions[order.status].includes(input.status))
            throw new ApiError(
              "CONFLICT",
              "That status transition is not allowed.",
            );
          if (order.changes.some((c) => c.status === "pending"))
            throw new ApiError(
              "CONFLICT",
              "Resolve the pending change request first.",
            );
          if (input.status === "confirmed") {
            dateRange(
              {
                pickupDate: rentalDate(order.pickupDate),
                returnDate: rentalDate(order.returnDate),
              },
              ctx.now,
            );
            await requireStock(tx, order.lines, order, order.id);
          }
          await tx.rentalOrder.update({
            where: { id: order.id },
            data: { status: input.status },
          });
          await audit(
            tx,
            actor,
            "order",
            order.id,
            orderStatusLabels[input.status],
            input.note,
            order.id,
          );
        },
      ),
    "admin.orders.resolve": (input, ctx) =>
      modify(input, "admin.orders.resolve", ctx, async (tx, actor, order) => {
        const change = order.changes.find((c) => c.id === input.changeId);
        if (
          !change ||
          change.status !== "pending" ||
          !["pending", "confirmed"].includes(order.status)
        )
          throw new ApiError(
            "CONFLICT",
            "This change request is no longer actionable.",
          );
        if (input.decision === "accepted") {
          if (change.kind === "dates") {
            const range = dateRange(
              {
                pickupDate: rentalDate(change.pickupDate),
                returnDate: rentalDate(change.returnDate),
              },
              ctx.now,
            );
            await requireStock(tx, order.lines, range, order.id);
            // Reprice with current catalog only to detect an incompatible change; never silently charge more.
            const catalog = await tx.product.findMany({
              where: { id: { in: order.lines.map((l) => l.productId) } },
            });
            const amounts = priceLines(
              order.lines.map((l) => {
                const p = catalog.find((p) => p.id === l.productId);
                if (!p) throw new ApiError("NOT_FOUND", "Product not found.");
                return { ...p, quantity: l.quantity };
              }),
              range,
              pricing,
            );
            if (amounts.some((amount, i) => amount !== order.lines[i].amount))
              throw new ApiError(
                "POLICY_REQUIRED",
                "These dates require a new agreed quote. The current order has not been changed.",
              );
            await tx.rentalOrder.update({
              where: { id: order.id },
              data: range,
            });
          } else
            await tx.rentalOrder.update({
              where: { id: order.id },
              data: { status: "cancelled" },
            });
        }
        await tx.orderChange.update({
          where: { id: change.id },
          data: {
            status: input.decision,
            decisionNote: input.note,
            resolvedBy: actor.userId,
            resolvedAt: ctx.now,
          },
        });
        await audit(
          tx,
          actor,
          "order",
          order.id,
          `Change ${input.decision}`,
          input.note,
          order.id,
        );
      }),
    "admin.payments.record": (input, ctx) =>
      modify(input, "admin.payments.record", ctx, async (tx, actor, order) => {
        const at = new Date(input.occurredAt);
        if (!Number.isFinite(at.getTime()) || at > ctx.now)
          throw new ApiError(
            "VALIDATION",
            "Enter a valid transaction time that is not in the future.",
          );
        const payment = summarizePayments(order.total, order.payments);
        if (
          input.kind === "refund" &&
          input.amount > payment.collected - payment.refunded
        )
          throw new ApiError(
            "VALIDATION",
            "Refund cannot exceed net money collected.",
          );
        if (
          input.kind === "collection" &&
          (["cancelled", "rejected"].includes(order.status) ||
            input.amount > payment.remaining)
        )
          throw new ApiError(
            "VALIDATION",
            "Collection cannot exceed the remaining amount or target a closed request.",
          );
        await tx.paymentEntry.create({
          data: {
            orderId: order.id,
            actorId: actor.userId,
            kind: input.kind,
            amount: input.amount,
            occurredAt: at,
            note: input.note,
          },
        });
        await audit(
          tx,
          actor,
          "order",
          order.id,
          input.kind === "collection"
            ? "Offline collection recorded"
            : "Offline refund recorded",
          input.note,
          order.id,
        );
      }),
  };
}
