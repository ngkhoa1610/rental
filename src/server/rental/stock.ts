import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError, type RentalDates } from "@/lib/api/contracts";
import { rentalDateError } from "@/lib/rental-dates";
import type { DateRange, StockAllocation } from "./models";

const DAY_MS = 86_400_000;

export function dateRange(input: RentalDates, now: Date): DateRange {
  const error = rentalDateError(input, now.getTime());
  if (error) throw new ApiError("VALIDATION", error);
  const pickupDate = new Date(`${input.pickupDate}T00:00:00Z`);
  const returnDate = new Date(`${input.returnDate}T00:00:00Z`);
  if (returnDate.getTime() - pickupDate.getTime() > 366 * DAY_MS)
    throw new ApiError("VALIDATION", "Choose a range of at most 367 days.");
  return { pickupDate, returnDate };
}
/** Sweep-line peak: disjoint bookings must not be added as though simultaneous. */
export function peakOccupancy(
  allocations: readonly StockAllocation[],
  range?: DateRange,
): number {
  const events = new Map<number, number>();
  const rangeStart = range?.pickupDate.getTime() ?? -Infinity;
  const rangeEnd = range?.returnDate.getTime() ?? Infinity;
  for (const allocation of allocations) {
    const start = Math.max(allocation.pickupDate.getTime(), rangeStart);
    const endExclusive =
      Math.min(allocation.returnDate.getTime(), rangeEnd) + DAY_MS;
    if (start >= endExclusive) continue;
    events.set(start, (events.get(start) ?? 0) + allocation.quantity);
    events.set(
      endExclusive,
      (events.get(endExclusive) ?? 0) - allocation.quantity,
    );
  }
  let current = 0;
  let peak = 0;
  for (const [, delta] of [...events].sort(([a], [b]) => a - b)) {
    current += delta;
    peak = Math.max(peak, current);
  }
  return peak;
}
export async function allocationSources(
  tx: Prisma.TransactionClient,
  productIds: readonly string[],
  range?: DateRange,
  excludeOrder?: string,
  excludeBlock?: string,
) {
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
  return {
    reservations: lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      ...l.order,
    })),
    blocks,
  };
}
export async function allocations(
  ...args: Parameters<typeof allocationSources>
): Promise<StockAllocation[]> {
  const { reservations, blocks } = await allocationSources(...args);
  return [...reservations, ...blocks];
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
    const product = products.find(({ id }) => id === line.productId);
    const available = product
      ? product.quantity -
        peakOccupancy(
          held.filter(({ productId }) => productId === line.productId),
          range,
        )
      : undefined;
    if (available === undefined || available < line.quantity)
      throw new ApiError(
        "UNAVAILABLE",
        "Items are no longer available for these dates. Please check again.",
      );
  }
}
