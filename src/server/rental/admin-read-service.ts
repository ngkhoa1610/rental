import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api/contracts";
import { monthDates } from "@/lib/rental-calendar";
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
import { allocationSources, peakOccupancy } from "./stock";

type AdminReadOperation =
  | Extract<keyof RentalServices, `admin.${string}.list`>
  | "admin.availability.stock";
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
    "admin.availability.stock": ({ month, productSlug }) =>
      db.$transaction(
        async (tx) => {
          const dates = monthDates(month);
          if (!dates.length)
            throw new ApiError("VALIDATION", "Chọn tháng hợp lệ.");
          const products = await tx.product.findMany({
            select: {
              id: true,
              slug: true,
              name: true,
              quantity: true,
              visibility: true,
            },
            orderBy: [{ name: "asc" }, { slug: "asc" }],
          });
          const choices = products.map(
            ({ slug, name, quantity, visibility }) => ({
              slug,
              name,
              quantity,
              visibility,
            }),
          );
          const selected = productSlug
            ? products.find(({ slug }) => slug === productSlug)
            : products[0];
          if (!selected && productSlug)
            throw new ApiError("NOT_FOUND", "Không tìm thấy sản phẩm.");
          if (!selected)
            return { products: choices, productSlug: null, days: [] };

          const boundaries = dates.map((date) => new Date(`${date}T00:00:00Z`));
          const { reservations, blocks } = await allocationSources(
            tx,
            [selected.id],
            {
              pickupDate: boundaries[0],
              returnDate: boundaries[boundaries.length - 1],
            },
          );
          const days = boundaries.map((point, index) => {
            const day = { pickupDate: point, returnDate: point };
            const reserved = peakOccupancy(reservations, day);
            const blocked = peakOccupancy(blocks, day);
            return {
              date: dates[index],
              reserved,
              blocked,
              available: Math.max(0, selected.quantity - reserved - blocked),
            };
          });
          return { products: choices, productSlug: selected.slug, days };
        },
        { isolationLevel: "RepeatableRead" },
      ),
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
