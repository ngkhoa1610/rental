import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  mapProduct,
  mapContent,
  mapReview,
  mapStaff,
  mapOrder,
  rentalDate,
} from "./mappers";
import { contentRelations } from "./admin-service";
import { orderRelations } from "./prisma-repository";
import type { RentalServices } from "./services";

type AdminReadOperation = Extract<keyof RentalServices, `admin.${string}.list`>;
/** Read-only admin views; authorization happens at the service boundary. */
export function adminReadServices(
  db: PrismaClient,
): Pick<RentalServices, AdminReadOperation> {
  const listOrders = async () =>
    (
      await db.rentalOrder.findMany({
        include: orderRelations,
        orderBy: { createdAt: "desc" },
      })
    ).map(mapOrder);
  return {
    "admin.products.list": async () =>
      (
        await db.product.findMany({
          include: { images: true },
          orderBy: { createdAt: "asc" },
        })
      ).map(mapProduct),
    "admin.availability.list": async () =>
      (
        await db.inventoryBlock.findMany({
          include: { product: { select: { slug: true } } },
          orderBy: { pickupDate: "asc" },
        })
      ).map((b) => ({
        id: b.id,
        productSlug: b.product.slug,
        pickupDate: rentalDate(b.pickupDate),
        returnDate: rentalDate(b.returnDate),
        quantity: b.quantity,
        reason: b.reason,
        version: b.version,
      })),
    "admin.customers.list": async () =>
      (
        await db.user.findMany({
          where: { OR: [{ staff: null }, { orders: { some: {} } }] },
          select: { id: true, name: true, phone: true },
          orderBy: { createdAt: "desc" },
        })
      ).map((u) => ({ ...u, name: u.name ?? "", permissions: [] })),
    "admin.content.list": async () =>
      (
        await db.editorialContent.findMany({
          include: contentRelations,
          orderBy: { createdAt: "desc" },
        })
      ).map(mapContent),
    "admin.reviews.list": async () =>
      (
        await db.customerReview.findMany({
          include: { media: true },
          orderBy: { createdAt: "desc" },
        })
      ).map(mapReview),
    "admin.staff.list": async () =>
      (
        await db.staffProfile.findMany({
          include: { user: true },
          orderBy: { createdAt: "asc" },
        })
      ).map(mapStaff),
    "admin.payments.list": listOrders,
    "admin.orders.list": listOrders,
  };
}
