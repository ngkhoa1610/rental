import "server-only";
import { ApiError } from "@/lib/api/contracts";
import type { DateRange } from "./models";
export interface PricingConfiguration {
  mode: "per-block" | null;
  version: string;
  quoteTtlMs: number;
}
export function pricingConfiguration(): PricingConfiguration {
  const ttl = Number(process.env.RENTAL_QUOTE_TTL_SECONDS ?? 300);
  return {
    mode: process.env.RENTAL_PRICING_MODE === "per-block" ? "per-block" : null,
    version: process.env.RENTAL_PRICING_VERSION ?? "",
    quoteTtlMs:
      Number.isInteger(ttl) && ttl >= 30 && ttl <= 3600 ? ttl * 1000 : 300000,
  };
}
export function priceLines<
  T extends { price: number; rentalDays: number; quantity: number },
>(
  lines: readonly T[],
  range: DateRange,
  config: PricingConfiguration,
): number[] {
  if (config.mode !== "per-block" || !config.version)
    throw new ApiError(
      "POLICY_REQUIRED",
      "The store must configure its rental pricing policy before quoting.",
    );
  const days =
    (range.returnDate.getTime() - range.pickupDate.getTime()) / 86400000 + 1;
  const amounts = lines.map(
    (l) => Math.ceil(days / l.rentalDays) * l.price * l.quantity,
  );
  if (
    amounts.some((n) => !Number.isSafeInteger(n) || n < 0) ||
    amounts.reduce((a, b) => a + b, 0) > 2147483647
  )
    throw new ApiError(
      "VALIDATION",
      "The rental amount exceeds the supported limit.",
    );
  return amounts;
}
