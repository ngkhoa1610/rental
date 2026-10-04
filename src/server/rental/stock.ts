import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError, type RentalDates } from "@/lib/api/contracts";
import { rentalDateError } from "@/lib/rental-dates";
import type { DateRange, StockAllocation } from "./models";
export function dateRange(input: RentalDates, now: Date): DateRange {
  const error = rentalDateError(input, now.getTime());
  if (error) throw new ApiError("VALIDATION", error);
  const pickupDate = new Date(`${input.pickupDate}T00:00:00Z`),
    returnDate = new Date(`${input.returnDate}T00:00:00Z`);
  if (returnDate.getTime() - pickupDate.getTime() > 366 * 86400000)
    throw new ApiError("VALIDATION", "Choose a range of at most 367 days.");
  return { pickupDate, returnDate };
}
/** Sweep-line peak: disjoint bookings must not be added as though simultaneous. */
export function peakOccupancy(
  allocations: readonly StockAllocation[],
  range?: DateRange,
): number {
  const events = new Map<number, number>();
  for (const a of allocations) {
    const start = Math.max(
      a.pickupDate.getTime(),
      range?.pickupDate.getTime() ?? -Infinity,
    );
    const end =
      Math.min(
        a.returnDate.getTime(),
        range?.returnDate.getTime() ?? Infinity,
      ) + 86400000;
    if (start >= end) continue;
    events.set(start, (events.get(start) ?? 0) + a.quantity);
    events.set(end, (events.get(end) ?? 0) - a.quantity);
  }
  let current = 0,
    peak = 0;
  for (const [, delta] of [...events].sort(([a], [b]) => a - b)) {
    current += delta;
    peak = Math.max(peak, current);
  }
  return peak;
}
export async function allocations(
  tx: Prisma.TransactionClient,
  productIds: readonly string[],
  range?: DateRange,
  excludeOrder?: string,
  excludeBlock?: string,
): Promise<StockAllocation[]> {
  const overlap = range
    ? {
        pickupDate: { lte: range.returnDate },
        returnDate: { gte: range.pickupDate },
      }
    : {};
  const [lines, blocks] = await Promise.all([
    tx.orderLine.findMany({
      where: {
        productId: { in: [...productIds] },
        order: {
          status: { in: ["confirmed", "renting"] },
          ...(excludeOrder ? { id: { not: excludeOrder } } : {}),
          ...overlap,
        },
      },
      include: { order: { select: { pickupDate: true, returnDate: true } } },
    }),
    tx.inventoryBlock.findMany({
      where: {
        productId: { in: [...productIds] },
        ...(excludeBlock ? { id: { not: excludeBlock } } : {}),
        ...overlap,
      },
    }),
  ]);
  return [
    ...lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      ...l.order,
    })),
    ...blocks,
  ];
}
export async function requireStock(
  tx: Prisma.TransactionClient,
  lines: readonly { productId: string; quantity: number }[],
  range: DateRange,
  excludeOrder?: string,
) {
  const ids = lines.map((l) => l.productId);
  const [products, held] = await Promise.all([
    tx.product.findMany({ where: { id: { in: ids } } }),
    allocations(tx, ids, range, excludeOrder),
  ]);
  for (const line of lines) {
    const p = products.find((p) => p.id === line.productId);
    if (
      !p ||
      p.quantity -
        peakOccupancy(
          held.filter((a) => a.productId === p.id),
          range,
        ) <
        line.quantity
    )
      throw new ApiError(
        "UNAVAILABLE",
        "Items are no longer available for these dates. Please check again.",
      );
  }
}
