import type { Prisma } from "@/generated/prisma/client";

/** Persistence aggregates, never response types. Auth fields stay outside rental aggregates. */
export type ProductRecord = Prisma.ProductGetPayload<{
  include: { images: true };
}>;
export type QuoteRecord = Prisma.RentalQuoteGetPayload<{
  include: { lines: true };
}>;
export type OrderRecord = Prisma.RentalOrderGetPayload<{
  include: {
    lines: true;
    payments: true;
    changes: true;
    audits: true;
    reviews: { include: { media: true } };
  };
}>;
export type EditorialRecord = Prisma.EditorialContentGetPayload<{
  include: { products: { include: { product: true } } };
}>;
export type ReviewRecord = Prisma.CustomerReviewGetPayload<{
  include: { media: true };
}>;
export type StaffRecord = Prisma.StaffProfileGetPayload<{
  include: { user: true };
}>;
export type DateRange = Readonly<{ pickupDate: Date; returnDate: Date }>;
export interface StockAllocation extends DateRange {
  productId: string;
  quantity: number;
}
