import type {
  DateRange,
  OrderRecord,
  ProductRecord,
  QuoteRecord,
  StockAllocation,
} from "./models";

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
