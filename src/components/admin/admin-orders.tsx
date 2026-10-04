"use client";
import { useState } from "react";
import type { RentalOrder } from "@/lib/api/contracts";
import { orderStatusLabels, orderTransitions } from "@/lib/order-workflow";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { T } from "@/components/store/language-provider";
import { RentalOrders } from "@/components/store/rental-orders";
import { Button } from "@/components/ui/button";
export function AdminOrders({
  paymentsOnly = false,
}: {
  paymentsOnly?: boolean;
}) {
  return (
    <RentalOrders
      admin
      paymentsOnly={paymentsOnly}
      renderOperations={(order, onUpdated) => (
        <AdminOrderActions
          order={order}
          onUpdated={onUpdated}
          paymentsOnly={paymentsOnly}
        />
      )}
    />
  );
}
function AdminOrderActions({
  order,
  onUpdated,
  paymentsOnly,
}: {
  order: RentalOrder;
  onUpdated: (order: RentalOrder) => void;
  paymentsOnly: boolean;
}) {
  const { api, session } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const requestKey = useRequestKey();
  const [notice, setNotice] = useState("");
  const pendingChange = paymentsOnly
    ? undefined
    : order.changes.find((change) => change.status === "pending");
  const mutation = { orderId: order.id, version: order.version };
  const save = async (work: () => Promise<RentalOrder>) => {
    setNotice("");
    onUpdated(await work());
    setNotice("Updated. See the order history below.");
  };
  return (
    <>
      {" "}
      {pendingChange && (
        <form
          className="store-api-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const payload = {
              ...mutation,
              changeId: pendingChange.id,
              decision:
                data.get("decision") === "accepted"
                  ? ("accepted" as const)
                  : ("rejected" as const),
              note: String(data.get("note") ?? ""),
            };
            void run(() =>
              save(() =>
                api.call("admin.orders.resolve", {
                  ...payload,
                  idempotencyKey: requestKey(payload),
                }),
              ),
            );
          }}
        >
          <label>
            <T>{"Decision"}</T>
            <select name="decision" disabled={busy}>
              <option value="accepted">
                <T>{"Accept change"}</T>
              </option>
              <option value="rejected">
                <T>{"Reject change"}</T>
              </option>
            </select>
          </label>
          <label>
            <T>{"Decision reason"}</T>
            <textarea name="note" required maxLength={1000} disabled={busy} />
          </label>
          <Button disabled={busy}>
            <T>{"Resolve change"}</T>
          </Button>
        </form>
      )}{" "}
      {!paymentsOnly &&
        !pendingChange &&
        orderTransitions[order.status].length > 0 && (
          <details>
            <summary>
              <T>{"Update rental status"}</T>
            </summary>
            <form
              key={`status-${order.version}`}
              className="store-api-form"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const status = orderTransitions[order.status].find(
                  (value) => value === data.get("status"),
                );
                if (!status) return;
                const payload = {
                  ...mutation,
                  status,
                  note: String(data.get("note") ?? ""),
                };
                void run(() =>
                  save(() =>
                    api.call("admin.orders.transition", {
                      ...payload,
                      idempotencyKey: requestKey(payload),
                    }),
                  ),
                );
              }}
            >
              <label>
                <T>{"Next status"}</T>
                <select name="status" disabled={busy}>
                  {orderTransitions[order.status].map((value) => (
                    <option key={value} value={value}>
                      <T>{orderStatusLabels[value]}</T>
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <T>{"Reason / garment condition"}</T>
                <textarea
                  name="note"
                  required
                  maxLength={1000}
                  disabled={busy}
                />
              </label>
              <Button disabled={busy}>
                <T>{"Update rental status"}</T>
              </Button>
            </form>
          </details>
        )}
      {paymentsOnly &&
        session.profile?.permissions.includes("payments:write") && (
          <details>
            <summary>
              <T>{"Record offline payment"}</T>
            </summary>
            <form
              key={`payment-${order.version}`}
              className="store-api-form"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const payload = {
                  ...mutation,
                  kind:
                    data.get("kind") === "refund"
                      ? ("refund" as const)
                      : ("collection" as const),
                  amount: Number(data.get("amount")),
                  occurredAt: String(data.get("occurredAt")),
                  note: String(data.get("note") ?? ""),
                };
                void run(async () => {
                  const timestamp = new Date(payload.occurredAt);
                  if (!Number.isFinite(timestamp.getTime()))
                    throw new Error("Enter a valid transaction time.");
                  const input = {
                    ...payload,
                    occurredAt: timestamp.toISOString(),
                  };
                  await save(() =>
                    api.call("admin.payments.record", {
                      ...input,
                      idempotencyKey: requestKey(input),
                    }),
                  );
                });
              }}
            >
              <p>
                <T>
                  {
                    "Record a transaction after money was actually collected or refunded. This does not charge a card."
                  }
                </T>
              </p>
              <label>
                <T>{"Transaction"}</T>
                <select name="kind" disabled={busy}>
                  <option value="collection">
                    <T>{"Collect payment"}</T>
                  </option>
                  <option value="refund">
                    <T>{"Refund"}</T>
                  </option>
                </select>
              </label>
              <label>
                <T>{"Amount (VND)"}</T>
                <input
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                <T>{"Transaction time"}</T>
                <input
                  name="occurredAt"
                  type="datetime-local"
                  step={1}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                <T>{"Payment note"}</T>
                <textarea
                  name="note"
                  required
                  maxLength={1000}
                  disabled={busy}
                />
              </label>
              <Button disabled={busy}>
                <T>{"Record transaction"}</T>
              </Button>
            </form>
          </details>
        )}
      {error && (
        <p role="alert">
          <T>{error}</T>
        </p>
      )}
      {notice && (
        <p role="status">
          <T>{notice}</T>
        </p>
      )}
    </>
  );
}
