"use client";
import { ReviewForm } from "./review-form";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog";
import { ApiError, type RentalOrder } from "@/lib/api/contracts";
import { orderStatusLabels } from "@/lib/order-workflow";
import { useRentalApi } from "./api-provider";
import { Flower2 } from "lucide-react";
import { T, useLanguage } from "./language-provider";

type OperationsRenderer = (
  order: RentalOrder,
  onUpdated: (order: RentalOrder) => void,
) => React.ReactNode;
export function RentalOrders({
  admin = false,
  renderOperations,
}: {
  admin?: boolean;
  renderOperations?: OperationsRenderer;
}) {
  const { session } = useRentalApi();
  if (
    !session.profile ||
    (admin && !session.profile.permissions.includes("orders:manage"))
  )
    return null;
  return (
    <OrderList
      key={session.profile.id}
      admin={admin}
      renderOperations={renderOperations}
    />
  );
}
function OrderList({
  admin,
  renderOperations,
}: {
  admin: boolean;
  renderOperations?: OperationsRenderer;
}) {
  const { api } = useRentalApi();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void api
      .call(admin ? "admin.orders.list" : "orders.list", undefined, {
        signal: controller.signal,
      })
      .then((items) => {
        if (active) {
          setOrders(items);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (
          active &&
          !(failure instanceof ApiError && failure.code === "ABORTED")
        )
          setError(
            failure instanceof Error
              ? failure.message
              : "Unable to load orders.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [api, admin, revision]);
  const [search, setSearch] = useState("");
  const visible = orders.filter((order) =>
    `${order.id} ${order.contact.name} ${order.status} ${t(orderStatusLabels[order.status])}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="store-api-form">
      <label>
        <T>{"Search orders"}</T>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="store-api-actions">
        <h2>
          <T>{admin ? "Rental operations" : "Your requests"}</T>
        </h2>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setRevision((value) => value + 1);
          }}
        >
          <T>{"Refresh orders"}</T>
        </Button>
      </div>
      {loading && (
        <p role="status">
          <T>{"Loading orders…"}</T>
        </p>
      )}
      {error && (
        <p role="alert">
          <T>{error}</T>
        </p>
      )}
      {!loading && !error && !visible.length && (
        <div className="store-api-panel">
          <h3>
            <T>{"No requests yet"}</T>
          </h3>
          <p>
            <T>
              {admin
                ? "Customer requests will appear here for review."
                : "Choose your looks and send a request from your rental bag."}
            </T>
          </p>
          {!admin && (
            <Link href="/cart" className="store-text-link">
              <T>{"Open rental bag"}</T>
            </Link>
          )}
        </div>
      )}
      {!loading &&
        !error &&
        visible.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            admin={admin}
            renderOperations={renderOperations}
            onUpdated={(updated) =>
              setOrders((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              )
            }
          />
        ))}
    </div>
  );
}

function OrderCard({
  order,
  admin,
  onUpdated,
  renderOperations,
}: {
  order: RentalOrder;
  admin: boolean;
  renderOperations?: OperationsRenderer;
  onUpdated: (order: RentalOrder) => void;
}) {
  const { t } = useLanguage();
  const { demo } = useRentalApi();
  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(`${value}T00:00:00Z`));
  return (
    <article
      className="store-order-card"
      aria-label={t("Order {id}", { id: order.id })}
    >
      <header className="store-receipt-header">
        <div className="store-receipt-brand">
          <Flower2 aria-hidden="true" />
          <span>RENTAL STORE</span>
        </div>
        <div className="store-receipt-title">
          <h3>
            <T>{"Rental request"}</T>
          </h3>
          <span className="store-api-badge" data-status={order.status}>
            <T>{orderStatusLabels[order.status]}</T>
          </span>
        </div>
        <p className="store-receipt-number">#{order.id}</p>
        {demo && (
          <p className="store-api-hint">
            <T>{"Demo receipt · not a tax invoice"}</T>
          </p>
        )}
      </header>
      <dl className="store-receipt-details">
        <div>
          <dt>
            <T>{"Customer"}</T>
          </dt>
          <dd>
            {order.contact.name}
            <span>{order.contact.phone}</span>
          </dd>
        </div>
        <div>
          <dt>
            <T>{"Rental period"}</T>
          </dt>
          <dd>
            {dateLabel(order.pickupDate)} → {dateLabel(order.returnDate)}
            <span>
              <T>{"Store pickup and return"}</T>
            </span>
          </dd>
        </div>
      </dl>
      <table className="store-receipt-items">
        <thead>
          <tr>
            <th scope="col">
              <T>{"Item"}</T>
            </th>
            <th scope="col">
              <T>{"Qty"}</T>
            </th>
            <th scope="col">
              <T>{"Rental amount"}</T>
            </th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.productSlug}>
              <td>{line.name}</td>
              <td>{line.quantity}</td>
              <td>{formatPrice(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {order.notes && (
        <div className="store-receipt-note">
          <p className="store-overline">
            <T>{"Customer notes:"}</T>
          </p>
          <p className="store-api-preserve">{order.notes}</p>
        </div>
      )}
      {!admin && order.status === "completed" && (
        <ReviewForm order={order} onUpdated={onUpdated} />
      )}
      {renderOperations?.(order, onUpdated)}
      <details>
        <summary>
          <T>{"Order updates"}</T>
        </summary>
        <ol className="store-order-history">
          {order.history.map((entry, index) => (
            <li key={index}>
              <strong>
                <T>{entry.action}</T>
              </strong>
              <p className="store-api-preserve">{entry.note}</p>
              <small>
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Asia/Ho_Chi_Minh",
                }).format(new Date(entry.at))}{" "}
                {admin ? `· ${entry.actorId}` : ""}
              </small>
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}
