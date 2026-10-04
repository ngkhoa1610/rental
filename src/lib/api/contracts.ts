import type { CatalogFilters, Product } from "../catalog";

/** Proposed FE contract v1. Dates are YYYY-MM-DD; money is integer VND. */
export type Permission =
  | "orders:manage"
  | "payments:write"
  | "catalog:manage"
  | "availability:manage"
  | "customers:read"
  | "content:manage"
  | "reviews:moderate"
  | "staff:manage";
export interface Profile {
  id: string;
  name: string;
  phone: string;
  permissions: Permission[];
}
export interface Session {
  profile: Profile | null;
  csrfToken: string | null;
}
export interface RentalDates {
  pickupDate: string;
  returnDate: string;
}
export interface RentalItem {
  productSlug: string;
  quantity: number;
}
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "renting"
  | "returned"
  | "completed"
  | "rejected"
  | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export interface PaymentSummary {
  due: number;
  collected: number;
  refunded: number;
  remaining: number;
  status: PaymentStatus;
}
export interface AvailabilityMonth {
  productSlug: string;
  month: string;
  checkedAt: string;
  days: { date: string; available: number }[];
}
export interface Quote extends RentalDates {
  id: string;
  expiresAt: string;
  lines: (RentalItem & { name: string; amount: number; available: number })[];
  total: number;
  currency: "VND";
  policyLabel: string;
}
export interface OrderChange extends RentalDates {
  id: string;
  kind: "dates" | "cancel";
  reason: string;
  status: "pending" | "accepted" | "rejected";
}
export interface AuditEntry {
  actorId: string;
  at: string;
  action: string;
  note: string;
}
export interface PaymentEntry {
  id: string;
  kind: "collection" | "refund";
  amount: number;
  occurredAt: string;
  note: string;
  actorId: string;
}
export interface RentalOrder extends RentalDates {
  id: string;
  customerId: string;
  contact: { name: string; phone: string };
  lines: Quote["lines"];
  notes: string;
  status: OrderStatus;
  version: number;
  createdAt: string;
  payment: PaymentSummary;
  payments: PaymentEntry[];
  changes: OrderChange[];
  history: AuditEntry[];
  review?: CustomerReview;
}
export interface Mutation {
  idempotencyKey: string;
}
export interface OrderMutation extends Mutation {
  orderId: string;
  version: number;
}
type Operation<Input, Output> = { input: Input; output: Output };

export interface ApiOperations {
  "reviews.create": Operation<
    Mutation & {
      orderId: string;
      rating: number;
      story: string;
      consentToPublish: boolean;
      mediaIds: string[];
    },
    CustomerReview
  >;
  "catalog.list": Operation<Partial<CatalogFilters>, Product[]>;
  "catalog.get": Operation<{ slug: string }, Product>;
  "session.get": Operation<void, Session>;
  "session.logout": Operation<void, void>;
  "profile.update": Operation<{ name: string; phone: string }, Profile>;
  "availability.calendar": Operation<
    { productSlug: string; month: string },
    AvailabilityMonth
  >;
  "availability.quote": Operation<RentalDates & { items: RentalItem[] }, Quote>;
  "orders.create": Operation<
    Mutation & { quoteId: string; notes: string },
    RentalOrder
  >;
  "orders.list": Operation<void, RentalOrder[]>;
  "orders.get": Operation<{ orderId: string }, RentalOrder>;
  "orders.change": Operation<
    OrderMutation & {
      kind: "dates" | "cancel";
      dates?: RentalDates;
      reason: string;
    },
    RentalOrder
  >;
  "admin.products.list": Operation<void, ManagedProduct[]>;
  "admin.products.save": Operation<
    Mutation & { product: ManagedProduct },
    ManagedProduct
  >;
  "admin.availability.list": Operation<void, InventoryBlock[]>;
  "admin.availability.save": Operation<
    Mutation & { block: InventoryBlock },
    InventoryBlock
  >;
  "admin.availability.remove": Operation<
    Mutation & { id: string; version: number },
    void
  >;
  "admin.customers.list": Operation<void, Profile[]>;
  "admin.content.list": Operation<void, EditorialContent[]>;
  "admin.content.save": Operation<
    Mutation & { content: EditorialContent },
    EditorialContent
  >;
  "admin.reviews.list": Operation<void, CustomerReview[]>;
  "admin.reviews.moderate": Operation<
    Mutation & {
      id: string;
      version: number;
      decision: "approved" | "rejected";
      note: string;
    },
    CustomerReview
  >;
  "admin.staff.list": Operation<void, StaffMember[]>;
  "admin.staff.update": Operation<
    Mutation & {
      id: string;
      version: number;
      active: boolean;
      permissions: Permission[];
    },
    StaffMember
  >;
  "admin.payments.list": Operation<void, RentalOrder[]>;
  "admin.orders.list": Operation<void, RentalOrder[]>;
  "admin.orders.transition": Operation<
    OrderMutation & { status: OrderStatus; note: string },
    RentalOrder
  >;
  "admin.orders.resolve": Operation<
    OrderMutation & {
      changeId: string;
      decision: "accepted" | "rejected";
      note: string;
    },
    RentalOrder
  >;
  "admin.payments.record": Operation<
    OrderMutation & {
      kind: "collection" | "refund";
      amount: number;
      occurredAt: string;
      note: string;
    },
    RentalOrder
  >;
}
export type OperationName = keyof ApiOperations;
export type Input<K extends OperationName> = ApiOperations[K]["input"];
export type Output<K extends OperationName> = ApiOperations[K]["output"];
export interface RentalApi {
  call<K extends OperationName>(
    operation: K,
    input: Input<K>,
    options?: { signal?: AbortSignal },
  ): Promise<Output<K>>;
}
export type ApiErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAVAILABLE"
  | "QUOTE_EXPIRED"
  | "POLICY_REQUIRED"
  | "NETWORK"
  | "TIMEOUT"
  | "ABORTED"
  | "INVALID_RESPONSE";
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public fields: Record<string, string> = {},
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Admin prototype records. Version 0 creates a new record; IDs stay immutable. */
export interface ManagedProduct extends Product {
  version: number;
  quantity: number;
  visibility: "draft" | "published";
}
export interface EditorialContent {
  version: number;
  id: string;
  kind: "collection" | "lookbook";
  title: string;
  body: string;
  productSlugs: string[];
  visibility: "draft" | "published";
}
export interface CustomerReview {
  version: number;
  moderationNote: string;
  id: string;
  orderId: string;
  rating: number;
  story: string;
  consentToPublish: boolean;
  mediaIds: string[];
  moderation: "pending" | "approved" | "rejected";
}

export interface InventoryBlock extends RentalDates {
  id: string;
  productSlug: string;
  quantity: number;
  reason: string;
  version: number;
}
export interface StaffMember extends Profile {
  active: boolean;
  version: number;
}
