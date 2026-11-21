import "server-only";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type { StaffPermission } from "@/generated/prisma/enums";
import { ApiError } from "@/lib/api/contracts";
import { permissionNames } from "@/server/auth/policy";
import { lockProducts } from "@/server/db/transaction";
import type { RentalServices } from "./services";
import { mutation, audit, requireVersion } from "./unit-of-work";
import { allocations, dateRange, peakOccupancy } from "./stock";
import {
  mapProduct,
  mapContent,
  mapReview,
  mapStaff,
  rentalDate,
} from "./mappers";
export const contentRelations = {
  products: { include: { product: true } },
} as const;
export function adminServices(
  db: PrismaClient,
): Pick<
  RentalServices,
  | "admin.products.save"
  | "admin.availability.save"
  | "admin.availability.remove"
  | "admin.content.save"
  | "admin.reviews.moderate"
  | "admin.staff.update"
> {
  return {
    "admin.products.save": (input, ctx) =>
      mutation(db, "admin.products.save", input, ctx, async (tx, actor) => {
        const value = input.product;
        const photos = [
          { url: value.image, alt: value.imageAlt },
          ...(value.additionalPhotos ?? []),
        ];
        const urls = new Set(photos.map(({ url }) => url));
        const mediaIds = [...urls]
          .filter((url) => url.startsWith("/media/"))
          .map((url) => url.slice(7));
        if (
          urls.size !== photos.length ||
          (mediaIds.length &&
            (await tx.mediaAsset.count({
              where: { id: { in: mediaIds }, purpose: "product" },
            })) !== mediaIds.length)
        )
          throw new ApiError(
            "VALIDATION",
            "Upload a valid product image first.",
          );
        const existing = await tx.product.findUnique({
          where: { slug: value.slug },
        });
        requireVersion(existing, value.version);
        if (existing) {
          await lockProducts(tx, [existing.id]);
          const held = await allocations(tx, [existing.id]);
          if (peakOccupancy(held) > value.quantity)
            throw new ApiError(
              "UNAVAILABLE",
              "Quantity cannot be lower than reserved or blocked stock.",
            );
        }
        const data = {
          slug: value.slug,
          name: value.name,
          description: value.description,
          category: value.category,
          collection: value.collection,
          occasions: [...new Set(value.occasions)],
          price: value.price,
          rentalDays: value.rentalDays,
          quantity: value.quantity,
          visibility: value.visibility,
        };
        const product = existing
          ? await tx.product.update({
              where: { id: existing.id, version: value.version },
              data: { ...data, version: { increment: 1 } },
              include: { images: true },
            })
          : await tx.product.create({ data, include: { images: true } });
        for (const [position, photo] of photos.entries()) {
          await tx.productImage.upsert({
            where: { productId_position: { productId: product.id, position } },
            create: { productId: product.id, position, ...photo },
            update: photo,
          });
        }
        if (value.additionalPhotos !== undefined) {
          await tx.productImage.deleteMany({
            where: { productId: product.id, position: { gte: photos.length } },
          });
        }
        await audit(
          tx,
          actor,
          "product",
          product.id,
          "Product saved",
          value.name,
        );
        return mapProduct(
          await tx.product.findUniqueOrThrow({
            where: { id: product.id },
            include: { images: true },
          }),
        );
      }),
    "admin.availability.save": (input, ctx) =>
      mutation(db, "admin.availability.save", input, ctx, async (tx, actor) => {
        const value = input.block;
        const existing = value.id
          ? await tx.inventoryBlock.findUnique({ where: { id: value.id } })
          : null;
        requireVersion(existing, value.version);
        const product = await tx.product.findUnique({
          where: { slug: value.productSlug },
        });
        if (!product) throw new ApiError("NOT_FOUND", "Product not found.");
        await lockProducts(tx, [
          product.id,
          ...(existing ? [existing.productId] : []),
        ]);
        const range = dateRange(value, ctx.now);
        const held = await allocations(
          tx,
          [product.id],
          undefined,
          undefined,
          existing?.id,
        );
        if (
          peakOccupancy([
            ...held,
            { ...range, quantity: value.quantity, productId: product.id },
          ]) > product.quantity
        )
          throw new ApiError(
            "UNAVAILABLE",
            "This block overlaps stock already reserved or blocked.",
          );
        const data = {
          ...range,
          productId: product.id,
          quantity: value.quantity,
          reason: value.reason,
        };
        const record = existing
          ? await tx.inventoryBlock.update({
              where: { id: existing.id, version: value.version },
              data: { ...data, version: { increment: 1 } },
            })
          : await tx.inventoryBlock.create({
              data: {
                ...data,
                id: value.id || randomUUID(),
                createdById: actor.userId,
              },
            });
        await audit(
          tx,
          actor,
          "inventory-block",
          record.id,
          "Unavailable dates saved",
          value.reason,
        );
        return {
          id: record.id,
          productSlug: product.slug,
          pickupDate: rentalDate(record.pickupDate),
          returnDate: rentalDate(record.returnDate),
          quantity: record.quantity,
          reason: record.reason,
          version: record.version,
        };
      }),
    "admin.availability.remove": (input, ctx) =>
      mutation(
        db,
        "admin.availability.remove",
        input,
        ctx,
        async (tx, actor) => {
          const record = await tx.inventoryBlock.findUnique({
            where: { id: input.id },
          });
          if (!record) throw new ApiError("NOT_FOUND", "Record not found.");
          requireVersion(record, input.version);
          await lockProducts(tx, [record.productId]);
          await tx.inventoryBlock.delete({
            where: { id: record.id, version: input.version },
          });
          await audit(
            tx,
            actor,
            "inventory-block",
            record.id,
            "Unavailable dates removed",
            record.reason,
          );
        },
      ),
    "admin.content.save": (input, ctx) =>
      mutation(db, "admin.content.save", input, ctx, async (tx, actor) => {
        const value = input.content;
        const existing = value.id
          ? await tx.editorialContent.findUnique({ where: { id: value.id } })
          : null;
        requireVersion(existing, value.version);
        const slugs = [...new Set(value.productSlugs)];
        const products = await tx.product.findMany({
          where: { slug: { in: slugs } },
        });
        if (products.length !== slugs.length)
          throw new ApiError("VALIDATION", "Choose valid related products.");
        const data = {
          kind: value.kind,
          title: value.title,
          body: value.body,
          visibility: value.visibility,
        };
        const record = existing
          ? await tx.editorialContent.update({
              where: { id: existing.id, version: value.version },
              data: { ...data, version: { increment: 1 } },
            })
          : await tx.editorialContent.create({
              data: { ...data, id: value.id || randomUUID() },
            });
        await tx.contentProduct.deleteMany({ where: { contentId: record.id } });
        await tx.contentProduct.createMany({
          data: slugs.map((slug, position) => {
            const p = products.find((p) => p.slug === slug);
            if (!p) throw new ApiError("NOT_FOUND", "Product not found.");
            return { contentId: record.id, productId: p.id, position };
          }),
        });
        await audit(
          tx,
          actor,
          "content",
          record.id,
          "Content saved",
          value.title,
        );
        return mapContent(
          await tx.editorialContent.findUniqueOrThrow({
            where: { id: record.id },
            include: contentRelations,
          }),
        );
      }),
    "admin.reviews.moderate": (input, ctx) =>
      mutation(db, "admin.reviews.moderate", input, ctx, async (tx, actor) => {
        const record = await tx.customerReview.findUnique({
          where: { id: input.id },
          include: { order: true },
        });
        if (!record) throw new ApiError("NOT_FOUND", "Record not found.");
        requireVersion(record, input.version);
        if (
          input.decision === "approved" &&
          (!record.consentToPublish || record.order.status !== "completed")
        )
          throw new ApiError(
            "VALIDATION",
            "Approval requires publication consent and a completed rental.",
          );
        const updated = await tx.customerReview.update({
          where: { id: record.id, version: input.version },
          data: {
            moderation: input.decision,
            moderationNote: input.note,
            version: { increment: 1 },
          },
          include: { media: true },
        });
        await audit(
          tx,
          actor,
          "review",
          record.id,
          "Review moderated",
          input.note,
        );
        return mapReview(updated);
      }),
    "admin.staff.update": (input, ctx) =>
      mutation(db, "admin.staff.update", input, ctx, async (tx, actor) => {
        const record = await tx.staffProfile.findUnique({
          where: { userId: input.id },
        });
        if (!record) throw new ApiError("NOT_FOUND", "Record not found.");
        requireVersion(record, input.version);
        if (!actor.isOwner || record.isOwner || record.userId === actor.userId)
          throw new ApiError(
            "FORBIDDEN",
            "The owner account cannot be changed here.",
          );
        if (input.permissions.includes("staff:manage"))
          throw new ApiError("FORBIDDEN", "Owner access cannot be delegated.");
        const names = Object.keys(permissionNames) as StaffPermission[];
        const updated = await tx.staffProfile.update({
          where: { userId: input.id, version: input.version },
          data: {
            active: input.active,
            permissions: names.filter((n) =>
              input.permissions.includes(permissionNames[n]),
            ),
            version: { increment: 1 },
          },
          include: { user: true },
        });
        if (!input.active)
          await tx.session.deleteMany({
            where: { userId: input.id, scope: "admin" },
          });
        await audit(
          tx,
          actor,
          "staff",
          record.userId,
          "Staff access updated",
          input.active ? "Permissions updated" : "Access disabled",
        );
        return mapStaff(updated);
      }),
  };
}
