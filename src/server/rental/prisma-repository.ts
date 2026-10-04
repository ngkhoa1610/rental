import "server-only";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { RentalReadRepository } from "./repositories";

export const orderRelations = {
  reviews: { include: { media: true } },
  lines: true,
  payments: { orderBy: { occurredAt: "asc" } },
  changes: { orderBy: { createdAt: "asc" } },
  audits: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.RentalOrderInclude;

export function createRentalReadRepository(
  db: PrismaClient | Prisma.TransactionClient,
): RentalReadRepository {
  return {
    findPublishedProduct: (slug) =>
      db.product.findFirst({
        where: { slug, visibility: "published" },
        include: { images: { orderBy: { position: "asc" } } },
      }),
    findQuote: (id) =>
      db.rentalQuote.findUnique({ where: { id }, include: { lines: true } }),
    findCustomerOrder: (id, customerId) =>
      db.rentalOrder.findFirst({
        where: { id, customerId },
        include: orderRelations,
      }),
    listCustomerOrders: (customerId) =>
      db.rentalOrder.findMany({
        where: { customerId },
        include: orderRelations,
        orderBy: { createdAt: "desc" },
      }),
    async allocations(productIds, dates) {
      const overlapping = {
        pickupDate: { lte: dates.returnDate },
        returnDate: { gte: dates.pickupDate },
      };
      const [lines, blocks] = await Promise.all([
        db.orderLine.findMany({
          where: {
            productId: { in: [...productIds] },
            order: { status: { in: ["confirmed", "renting"] }, ...overlapping },
          },
          include: {
            order: { select: { pickupDate: true, returnDate: true } },
          },
        }),
        db.inventoryBlock.findMany({
          where: { productId: { in: [...productIds] }, ...overlapping },
        }),
      ]);
      return [
        ...lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          ...line.order,
        })),
        ...blocks.map((block) => ({
          productId: block.productId,
          quantity: block.quantity,
          pickupDate: block.pickupDate,
          returnDate: block.returnDate,
        })),
      ];
    },
  };
}
