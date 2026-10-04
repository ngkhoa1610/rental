import type {
  Input,
  OperationName,
  Output,
  Quote,
  RentalItem,
  RentalDates,
} from "@/lib/api/contracts";
import type { Principal } from "@/server/auth/policy";
import type { ApiScope } from "@/lib/access";

/** Construct on the server after session/CSRF checks; never accept from a request body. */
export interface ServiceContext {
  readonly principal: Principal | null;
  readonly scope: ApiScope;
  readonly requestId: string;
  readonly now: Date;
  readonly signal?: AbortSignal;
  readonly sessionId?: string;
  readonly csrfToken?: string;
}
export type ServiceHandler<K extends OperationName> = (
  input: Input<K>,
  context: ServiceContext,
) => Promise<Output<K>>;
/** Implementing this map requires coverage of every existing FE operation. No runtime stubs. */
export type RentalServices = { [K in OperationName]: ServiceHandler<K> };
export type AdminServices = Pick<
  RentalServices,
  Extract<OperationName, `admin.${string}`>
>;
export type CustomerServices = Omit<RentalServices, keyof AdminServices>;

/** Store-approved pricing is injected; the mock 1–3 day fixture is not a live implementation. */
export interface PricingPolicy {
  quote(
    input: RentalDates & { items: RentalItem[] },
    context: ServiceContext,
  ): Promise<
    Pick<Quote, "total" | "currency" | "policyLabel" | "lines"> & {
      policyVersion: string;
      expiresAt: Date;
    }
  >;
}
export interface MutationReceipt<T> {
  readonly value: T;
  readonly replayed: boolean;
}
export interface IdempotencyIdentity {
  actorId: string;
  scope: ApiScope;
  operation: OperationName;
  key: string;
  /** SHA-256 of a canonical, validated payload; never the raw payload. */
  fingerprint: string;
}
