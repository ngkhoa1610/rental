import type { Prisma } from "@/generated/prisma/client";
import type {
  DateRange,
  OrderRecord,
  ProductRecord,
  QuoteRecord,
  StockAllocation,
} from "./models";
import type { IdempotencyIdentity, MutationReceipt } from "./services";

export interface RentalReadRepository {
  findPublishedProduct(slug: string): Promise<ProductRecord | null>;
  findQuote(id: string): Promise<QuoteRecord | null>;
  /** Ownership is in the WHERE clause; inaccessible orders return null. */
  findCustomerOrder(
    id: string,
    customerId: string,
  ): Promise<OrderRecord | null>;
  listCustomerOrders(customerId: string): Promise<OrderRecord[]>;
  allocations(
    productIds: readonly string[],
    dates: DateRange,
  ): Promise<StockAllocation[]>;
}
/** Future write services must commit state/audit/idempotency as one unit, not three calls. */
export interface RentalUnitOfWork {
  run<T extends Prisma.InputJsonValue>(
    identity: IdempotencyIdentity,
    work: (tx: RentalTransaction) => Promise<T>,
  ): Promise<MutationReceipt<T>>;
}
export interface RentalTransaction {
  readonly client: Prisma.TransactionClient;
  /** Stable sorted row locks, followed by overlapping stock calculation in this transaction. */
  lockProducts(productIds: readonly string[]): Promise<void>;
  /** Must reject stale version rather than overwrite somebody else's work. */
  requireOrderVersion(
    orderId: string,
    expectedVersion: number,
  ): Promise<OrderRecord>;
}
// Mutating repository implementations are intentionally not wired: they require the
// approved service rules for pricing, ownership, stock, version and ledger validation.
