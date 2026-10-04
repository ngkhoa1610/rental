import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api/contracts";
import { getDatabase } from "@/server/db/client";
import { serializable } from "@/server/db/transaction";
import { authorize, audit } from "@/server/rental/unit-of-work";
import {
  sessionContext,
  verifyOrigin,
  verifyCsrf,
  rateLimit,
} from "./security";
import { errorResponse } from "./handler";
export async function uploadMedia(
  request: Request,
  database?: PrismaClient,
  purpose: "review" | "product" = "review",
): Promise<Response> {
  try {
    const db = database ?? getDatabase(),
      scope = purpose === "product" ? "admin" : "customer",
      operation =
        purpose === "product" ? "admin.products.save" : "reviews.create",
      ctx = await sessionContext(db, request, scope);
    await authorize(db, operation, ctx);
    verifyOrigin(request);
    verifyCsrf(request, ctx);
    await rateLimit(db, request, ctx, "media.upload");
    const orderId =
      purpose === "review" ? (request.headers.get("x-order-id") ?? "") : "";
    if (
      purpose === "review" &&
      (!orderId ||
        orderId.length > 128 ||
        !(await db.rentalOrder.findFirst({
          where: {
            id: orderId,
            customerId: ctx.principal?.userId ?? "",
            status: "completed",
          },
        })))
    )
      throw new ApiError(
        "NOT_FOUND",
        "A completed rental of your own is required.",
      );
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        request.headers.get("content-type") ?? "",
      )
    )
      throw new ApiError(
        "VALIDATION",
        "Choose a JPEG, PNG or WebP photo.",
        {},
        415,
      );
    const limit = 4194304;
    if (Number(request.headers.get("content-length") ?? 0) > limit)
      throw new ApiError(
        "VALIDATION",
        "Each photo must be at most 4 MB.",
        {},
        413,
      );
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError("VALIDATION", "Choose a photo.");
    const parts: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > limit) {
          await reader.cancel();
          throw new ApiError(
            "VALIDATION",
            "Each photo must be at most 4 MB.",
            {},
            413,
          );
        }
        parts.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let bytes: Buffer;
    try {
      const source = sharp(Buffer.concat(parts), {
          limitInputPixels: 16000000,
          animated: false,
        }),
        meta = await source.metadata();
      if (
        !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
        (meta.pages ?? 1) > 1
      )
        throw new Error();
      bytes = await source
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new ApiError(
        "VALIDATION",
        "This photo could not be processed. Choose a JPEG, PNG or WebP photo.",
      );
    }
    if (bytes.length > 2097152)
      throw new ApiError("VALIDATION", "The processed photo is too large.");
    const asset = await serializable(db, async (tx) => {
      const actor = await authorize(tx, operation, ctx);
      if (!actor)
        throw new ApiError("UNAUTHENTICATED", "Please sign in again.");
      const id = createHash("sha256")
          .update(`${actor.userId}:${purpose}:${orderId}:`)
          .update(bytes)
          .digest("hex"),
        prior = await tx.mediaAsset.findUnique({
          where: { id },
          select: { id: true },
        });
      if (prior) return prior;
      if (purpose === "review") {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "RentalOrder" WHERE id=${orderId} FOR UPDATE`,
        );
        if (await tx.customerReview.count({ where: { orderId } }))
          throw new ApiError("CONFLICT", "You already reviewed this rental.");
        if (
          (await tx.mediaAsset.count({
            where: { ownerId: actor.userId, orderId },
          })) >= 3
        )
          throw new ApiError(
            "VALIDATION",
            "Each rental can have at most 3 photos.",
          );
      }
      const result = await tx.mediaAsset.create({
        data: {
          id,
          ownerId: actor.userId,
          orderId: purpose === "review" ? orderId : null,
          purpose,
          data: new Uint8Array(bytes),
          byteLength: bytes.length,
        },
        select: { id: true },
      });
      await audit(
        tx,
        actor,
        "media",
        result.id,
        "Photo uploaded",
        "Photo normalized; metadata removed",
      );
      return result;
    });
    return Response.json(
      { data: asset },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function readMedia(
  request: Request,
  id: string,
  database?: PrismaClient,
): Promise<Response> {
  try {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id))
      throw new ApiError("NOT_FOUND", "Photo not found.");
    const db = database ?? getDatabase(),
      asset = await db.mediaAsset.findUnique({
        where: { id },
        select: {
          ownerId: true,
          purpose: true,
          data: true,
          reviewLinks: {
            select: {
              review: {
                select: {
                  consentToPublish: true,
                  moderation: true,
                  order: { select: { status: true } },
                },
              },
            },
          },
        },
      });
    if (!asset) throw new ApiError("NOT_FOUND", "Photo not found.");
    const published =
      (asset.purpose === "product" &&
        Boolean(
          await db.productImage.findFirst({
            where: {
              url: "/media/" + id,
              product: { visibility: "published" },
            },
          }),
        )) ||
      asset.reviewLinks.some(
        (l) =>
          l.review.consentToPublish &&
          l.review.moderation === "approved" &&
          l.review.order.status === "completed",
      );
    if (!published) {
      const c = await sessionContext(db, request, "customer"),
        a = await sessionContext(db, request, "admin");
      if (
        c.principal?.userId !== asset.ownerId &&
        !a.principal?.permissions.includes(
          asset.purpose === "product" ? "catalog:manage" : "reviews:moderate",
        )
      )
        throw new ApiError("NOT_FOUND", "Photo not found.");
    }
    return new Response(new Uint8Array(asset.data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
