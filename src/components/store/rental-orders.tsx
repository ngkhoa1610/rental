"use client";
import { ReviewForm } from "./review-form";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog";
import { ApiError, type RentalOrder } from "@/lib/api/contracts";
import { orderStatusLabels } from "@/lib/order-workflow";
import { useApiAction, useRentalApi, useRequestKey } from "./api-provider";
import { Flower2, ReceiptText } from "lucide-react";

import { RentalDateFields } from "./rental-date-fields";
import { rentalDateError } from "@/lib/rental-dates";
import { T, useLanguage } from "./language-provider";

type OperationsRenderer = (
  order: RentalOrder,
  onUpdated: (order: RentalOrder) => void,
) => React.ReactNode;
export function RentalOrders({
  admin = false,
  history = false,
  paymentsOnly = false,
  renderOperations,
}: {
  admin?: boolean;
  history?: boolean;
  paymentsOnly?: boolean;
  renderOperations?: OperationsRenderer;
}) {
  const { session } = useRentalApi();
  if (
    !session.profile ||
    (admin &&
      !session.profile.permissions.includes(
        paymentsOnly ? "payments:write" : "orders:manage",
      ))
  )
    return null;
  return (
    <OrderList
      key={session.profile.id}
      admin={admin}
      history={history}
      paymentsOnly={paymentsOnly}
      renderOperations={renderOperations}
    />
  );
}
function OrderList({
  admin,
  history,
  paymentsOnly,
  renderOperations,
}: {
  admin: boolean;
  history: boolean;
  paymentsOnly: boolean;
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
      .call(
        admin
          ? paymentsOnly
            ? "admin.payments.list"
            : "admin.orders.list"
          : "orders.list",
        undefined,
        {
          signal: controller.signal,
        },
      )
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
  }, [api, admin, paymentsOnly, revision]);
  const [search, setSearch] = useState("");
  const visible = orders.filter(
    (order) =>
      (admin ||
        ["completed", "cancelled", "rejected"].includes(order.status) ===
          history) &&
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
  const { t, language } = useLanguage();
  const { api, demo } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const requestKey = useRequestKey();
  const [notice, setNotice] = useState("");
  const [changeKind, setChangeKind] = useState("dates");
  const [changeDates, setChangeDates] = useState({
    pickupDate: order.pickupDate,
    returnDate: order.returnDate,
  });
  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(`${value}T00:00:00Z`));
  const canChange = ["pending", "confirmed"].includes(order.status);
  const pendingChange = order.changes.find(
    (change) => change.status === "pending",
  );
  const mutation = { orderId: order.id, version: order.version };
  const save = async (work: () => Promise<RentalOrder>) => {
    setNotice("");
    onUpdated(await work());
    setNotice("Updated. See the order history below.");
  };
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
            <T>{"Rental receipt"}</T>
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
              <T>{"Amount"}</T>
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
      <dl className="store-payment-summary">
        <div className="store-receipt-total">
          <dt>
            <T>{"Total due"}</T>
          </dt>
          <dd>{formatPrice(order.payment.due)}</dd>
        </div>
        <div>
          <dt>
            <T>{"Collected"}</T>
          </dt>
          <dd>{formatPrice(order.payment.collected)}</dd>
        </div>
        <div>
          <dt>
            <T>{"Refunded"}</T>
          </dt>
          <dd>{formatPrice(order.payment.refunded)}</dd>
        </div>
        <div className="store-receipt-balance">
          <dt>
            <T>{"Remaining"}</T>
          </dt>
          <dd>{formatPrice(order.payment.remaining)}</dd>
        </div>
      </dl>
      <p className="store-receipt-payment">
        <ReceiptText aria-hidden="true" />
        <span>
          <T>{"Payment: "}</T>
          <strong>
            <T>{order.payment.status}</T>
          </strong>{" "}
          ·{" "}
          <span>
            <T>{"Offline"}</T>
          </span>
        </span>
      </p>
      {pendingChange && (
        <div className="store-api-panel">
          <h4>
            <T>{"Change awaiting review"}</T>
          </h4>
          <p>
            {pendingChange.kind === "dates"
              ? `${dateLabel(pendingChange.pickupDate ?? order.pickupDate)} → ${dateLabel(pendingChange.returnDate ?? order.returnDate)}`
              : t("Cancellation request")}
          </p>
          <p className="store-api-preserve">{pendingChange.reason}</p>
        </div>
      )}
      {!admin && canChange && !pendingChange && (
        <details>
          <summary>
            <T>{"Request a date change or cancellation"}</T>
          </summary>
          <form
            className="store-api-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const kind =
                changeKind === "dates"
                  ? ("dates" as const)
                  : ("cancel" as const);
              const payload = {
                ...mutation,
                kind,
                ...(kind === "dates"
                  ? {
                      dates: changeDates,
                    }
                  : {}),
                reason: String(data.get("reason") ?? ""),
              };
              void run(async () => {
                const dateError =
                  kind === "dates" ? rentalDateError(changeDates) : null;
                if (dateError) throw new Error(dateError);
                await save(() =>
                  api.call("orders.change", {
                    ...payload,
                    idempotencyKey: requestKey(payload),
                  }),
                );
              });
            }}
          >
            <label>
              <T>{"Request type"}</T>
              <select
                value={changeKind}
                disabled={busy}
                onChange={(event) => setChangeKind(event.target.value)}
              >
                <option value="dates">
                  <T>{"Change dates"}</T>
                </option>
                <option value="cancel">
                  <T>{"Cancel rental"}</T>
                </option>
              </select>
            </label>
            {changeKind === "dates" && (
              <RentalDateFields
                dates={changeDates}
                onChange={setChangeDates}
                disabled={busy}
                change
              />
            )}
            <label>
              <T>{"Reason"}</T>
              <textarea
                name="reason"
                required
                maxLength={1000}
                disabled={busy}
              />
            </label>
            <p>
              <T>
                {
                  "Staff will review your request. Your current order stays unchanged until approval."
                }
              </T>
            </p>
            <Button variant="outline" disabled={busy}>
              <T>{"Send change request"}</T>
            </Button>
          </form>
        </details>
      )}
      {!admin && order.status === "completed" && (
        <ReviewForm order={order} onUpdated={onUpdated} />
      )}
      {renderOperations?.(order, onUpdated)}
      {error && (
        <p className="store-api-error" role="alert">
          <T>{error}</T>
        </p>
      )}
      {notice && (
        <p role="status">
          <T>{notice}</T>
        </p>
      )}
      <details>
        <summary>
          <T>{"Order history and transactions"}</T>
        </summary>
        <ol className="store-order-history">
          {order.history.map((entry, index) => (
            <li key={index}>
              <strong>
                <T>{entry.action}</T>
              </strong>
              <p className="store-api-preserve">{entry.note}</p>
              <small>
                {new Intl.DateTimeFormat(
                  language === "vi" ? "vi-VN" : "en-GB",
                  {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "Asia/Ho_Chi_Minh",
                  },
                ).format(new Date(entry.at))}{" "}
                {admin ? `· ${entry.actorId}` : ""}
              </small>
            </li>
          ))}
        </ol>
        {order.payments.map((entry) => (
          <p key={entry.id}>
            {t(entry.kind)}: {formatPrice(entry.amount)} · {entry.occurredAt} ·{" "}
            {entry.note}
          </p>
        ))}
      </details>
    </article>
  );
}
