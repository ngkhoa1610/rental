import "server-only";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { RentalReadRepository } from "./repositories";
import { allocations } from "./stock";

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
      const held = await allocations(db, productIds, dates);
      return held.map(({ productId, quantity, pickupDate, returnDate }) => ({
        productId,
        quantity,
        pickupDate,
        returnDate,
      }));
    },
  };
}
