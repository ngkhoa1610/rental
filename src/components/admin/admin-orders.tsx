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

export function AdminOrders() {
  return (
    <RentalOrders
      admin
      renderOperations={(order, onUpdated) => (
        <AdminOrderActions order={order} onUpdated={onUpdated} />
      )}
    />
  );
}

function AdminOrderActions({
  order,
  onUpdated,
}: {
  order: RentalOrder;
  onUpdated: (order: RentalOrder) => void;
}) {
  const { api } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const requestKey = useRequestKey();
  const [notice, setNotice] = useState("");
  const mutation = { orderId: order.id, version: order.version };
  const save = async (work: () => Promise<RentalOrder>) => {
    setNotice("");
    onUpdated(await work());
    setNotice("Order status updated.");
  };

  return (
    <>
      {orderTransitions[order.status].length > 0 && (
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
              <T>{"Staff note"}</T>
              <textarea name="note" required maxLength={1000} disabled={busy} />
            </label>
            <Button disabled={busy}>
              <T>{"Update rental status"}</T>
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
