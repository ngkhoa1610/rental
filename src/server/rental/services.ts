import type { Input, OperationName, Output } from "@/lib/api/contracts";
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
