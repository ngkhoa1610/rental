"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import type { OrderStatus, RentalOrder } from "@/lib/api/contracts";
import { orderStatusLabels, orderTransitions } from "@/lib/order-workflow";
import { rentalToday } from "@/lib/rental-dates";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";

export const orderQueues = [
  { key: "pending", label: "Chờ duyệt", empty: "Không có đơn chờ duyệt." },
  {
    key: "pickup",
    label: "Giao hôm nay",
    empty: "Không có đơn cần giao hôm nay.",
  },
  {
    key: "return",
    label: "Nhận trả hôm nay",
    empty: "Không có đơn hẹn trả hôm nay.",
  },
  { key: "overdue", label: "Trả quá hạn", empty: "Không có đơn trả quá hạn." },
] as const;

type OrderQueue = (typeof orderQueues)[number]["key"];

export function ordersInQueue(
  orders: readonly RentalOrder[],
  queue: OrderQueue,
  today: string,
) {
  return orders.filter((order) => {
    switch (queue) {
      case "pending":
        return order.status === "pending";
      case "pickup":
        return order.status === "confirmed" && order.pickupDate === today;
      case "return":
        return (
          (order.status === "confirmed" || order.status === "renting") &&
          order.returnDate === today
        );
      case "overdue":
        return order.status === "renting" && order.returnDate < today;
    }
  });
}

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const timestampFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});
const moneyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function formatOrderDate(date: string) {
  return dateFormat.format(new Date(date));
}

function searchable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replaceAll("đ", "d");
}

export function AdminOrders({
  queue,
  orderId,
}: { queue?: string; orderId?: string } = {}) {
  return (
    <AdminData operation="admin.orders.list" showRefresh={false}>
      {(orders, reload) => (
        <OrderWorkspace
          key={JSON.stringify([queue, orderId])}
          orders={orders}
          initialQueue={
            orderQueues.find((item) => item.key === queue)?.key ?? ""
          }
          initialOrderId={orderId}
          reload={reload}
        />
      )}
    </AdminData>
  );
}

function OrderWorkspace({
  orders: initialOrders,
  initialQueue,
  initialOrderId,
  reload,
}: {
  orders: RentalOrder[];
  initialQueue: OrderQueue | "";
  initialOrderId?: string;
  reload: () => void;
}) {
  const { t } = useLanguage();
  const action = useApiAction();
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [queue, setQueue] = useState(initialQueue);
  const [dateKind, setDateKind] = useState<"pickupDate" | "returnDate">(
    "pickupDate",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState(initialOrderId);
  const searchRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef(false);
  const selected = orders.find((order) => order.id === selectedId);
  const displayedOrderId = selected?.id;

  useEffect(() => {
    if (displayedOrderId) detailRef.current?.focus();
    else if (returnFocus.current) searchRef.current?.focus();
    returnFocus.current = false;
  }, [displayedOrderId]);

  const queryText = searchable(query.trim());
  const phoneQuery = /^[+\d ()-]+$/.test(queryText)
    ? queryText.replace(/\D/g, "")
    : "";
  const orderPool = queue
    ? ordersInQueue(orders, queue, rentalToday())
    : orders;
  const filtered = orderPool.filter((order) => {
    const date = order[dateKind];
    const matchesText =
      !queryText ||
      searchable(order.id).includes(queryText) ||
      searchable(order.contact.name).includes(queryText) ||
      (phoneQuery &&
        order.contact.phone.replace(/\D/g, "").includes(phoneQuery));
    return (
      matchesText &&
      (!status || order.status === status) &&
      (!from || date >= from) &&
      (!to || date <= to)
    );
  });

  if (selected) {
    return (
      <section
        className="admin-surface admin-panel"
        aria-labelledby="admin-order-detail"
      >
        <Button
          variant="outline"
          disabled={action.busy}
          onClick={() => {
            action.clearError();
            returnFocus.current = true;
            setSelectedId(undefined);
          }}
        >
          <ArrowLeft aria-hidden="true" /> Về danh sách đơn
        </Button>
        <div className="admin-page-actions admin-order-detail-heading">
          <div>
            <h2 id="admin-order-detail" tabIndex={-1} ref={detailRef}>
              Đơn {selected.id}
            </h2>
            <p>
              Ngày tạo {timestampFormat.format(new Date(selected.createdAt))}
            </p>
          </div>
          <OrderBadge status={selected.status} />
        </div>
        <dl className="admin-order-meta">
          <div>
            <dt>Khách thuê lúc đặt</dt>
            <dd>{selected.contact.name}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{selected.contact.phone}</dd>
          </div>
          <div>
            <dt>Ngày nhận</dt>
            <dd>{formatOrderDate(selected.pickupDate)}</dd>
          </div>
          <div>
            <dt>Ngày trả</dt>
            <dd>{formatOrderDate(selected.returnDate)}</dd>
          </div>
        </dl>
        <h3>Món thuê</h3>
        <div className="admin-table-wrap">
          <table className="admin-table admin-order-lines">
            <thead>
              <tr>
                <th scope="col">Sản phẩm</th>
                <th scope="col">Số lượng</th>
                <th scope="col">Tiền thuê</th>
              </tr>
            </thead>
            <tbody>
              {selected.lines.map((line) => (
                <tr key={line.productSlug}>
                  <th scope="row">{line.name}</th>
                  <td data-label="Số lượng">{line.quantity}</td>
                  <td data-label="Tiền thuê">
                    {moneyFormat.format(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="admin-order-total">
          Tổng tiền thuê{" "}
          <strong>
            {moneyFormat.format(
              selected.lines.reduce((sum, line) => sum + line.amount, 0),
            )}
          </strong>
        </p>
        <h3>Ghi chú của khách</h3>
        <p className="admin-order-note">
          {selected.notes || "Không có ghi chú."}
        </p>
        <AdminOrderActions
          key={selected.id}
          order={selected}
          action={action}
          onUpdated={(updated) =>
            setOrders((previous) =>
              previous.map((order) =>
                order.id === updated.id ? updated : order,
              ),
            )
          }
        />
        <h3>Lịch sử xử lý</h3>
        {selected.history.length ? (
          <ol className="admin-record-list">
            {selected.history.map((entry, index) => (
              <li className="admin-record" key={index}>
                <strong>{t(entry.action)}</strong>{" "}
                <time dateTime={entry.at}>
                  {timestampFormat.format(new Date(entry.at))}
                </time>
                {entry.note && <p className="admin-order-note">{entry.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p>Chưa có hoạt động.</p>
        )}
      </section>
    );
  }

  return (
    <section
      className="admin-surface admin-panel"
      aria-labelledby="admin-order-list"
    >
      <h2 id="admin-order-list">Danh sách đơn</h2>
      {selectedId && (
        <p role="status">Không tìm thấy đơn này trong danh sách.</p>
      )}
      <div className="admin-form">
        <label>
          <span>
            <Search aria-hidden="true" width={16} height={16} /> Tìm đơn
          </span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Mã đơn, tên khách hoặc số điện thoại"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="admin-field-row">
          <label>
            Việc cần xử lý
            <select
              value={queue}
              onChange={(event) =>
                setQueue(
                  orderQueues.find((item) => item.key === event.target.value)
                    ?.key ?? "",
                )
              }
            >
              <option value="">Tất cả đơn</option>
              {orderQueues.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trạng thái
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Lọc theo
            <select
              value={dateKind}
              onChange={(event) =>
                setDateKind(
                  event.target.value === "returnDate"
                    ? "returnDate"
                    : "pickupDate",
                )
              }
            >
              <option value="pickupDate">Ngày nhận</option>
              <option value="returnDate">Ngày trả</option>
            </select>
          </label>
          <label>
            Từ ngày
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="admin-page-actions admin-order-results">
        <p aria-live="polite">{filtered.length} đơn</p>
        <Button variant="outline" onClick={() => reload()}>
          Làm mới
        </Button>
        {(query || status || queue || from || to) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              setStatus("");
              setQueue("");
              setFrom("");
              setTo("");
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
      {from && to && from > to && (
        <p role="alert">Ngày kết thúc phải từ ngày bắt đầu trở đi.</p>
      )}
      {filtered.length ? (
        <AdminOrdersTable orders={filtered} onSelect={setSelectedId} />
      ) : (
        <p>
          {orders.length
            ? "Không có đơn phù hợp với bộ lọc."
            : "Chưa có đơn thuê."}
        </p>
      )}
    </section>
  );
}

export function AdminOrdersTable({
  orders,
  onSelect,
}: {
  orders: readonly Pick<
    RentalOrder,
    "id" | "contact" | "pickupDate" | "returnDate" | "status"
  >[];
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-orders-table">
        <thead>
          <tr>
            <th scope="col">Mã đơn</th>
            <th scope="col">Khách thuê</th>
            <th scope="col">Ngày nhận</th>
            <th scope="col">Ngày trả</th>
            <th scope="col">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <th scope="row">
                {onSelect ? (
                  <button
                    className="admin-text-action"
                    type="button"
                    onClick={() => onSelect(order.id)}
                    aria-label={"Mở đơn " + order.id}
                  >
                    {order.id}{" "}
                    <ChevronRight aria-hidden="true" width={16} height={16} />
                  </button>
                ) : (
                  order.id
                )}
              </th>
              <td data-label="Khách thuê">
                <strong>{order.contact.name}</strong>
                <br />
                {order.contact.phone}
              </td>
              <td data-label="Ngày nhận">
                {formatOrderDate(order.pickupDate)}
              </td>
              <td data-label="Ngày trả">{formatOrderDate(order.returnDate)}</td>
              <td data-label="Trạng thái">
                <OrderBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrderBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  return (
    <span className="admin-badge" data-status={status}>
      {t(orderStatusLabels[status])}
    </span>
  );
}

function AdminOrderActions({
  order,
  onUpdated,
  action,
}: {
  order: RentalOrder;
  onUpdated: (order: RentalOrder) => void;
  action: ReturnType<typeof useApiAction>;
}) {
  const { api } = useRentalApi();
  const { t } = useLanguage();
  const { busy, error, run } = action;
  const requestKey = useRequestKey();
  const [notice, setNotice] = useState("");
  const transitions = orderTransitions[order.status];

  return (
    <div className="admin-order-actions">
      {transitions.length > 0 && (
        <form
          key={order.version}
          className="admin-form"
          aria-label="Cập nhật trạng thái đơn"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const status = transitions.find(
              (value) => value === data.get("status"),
            );
            if (!status) return;
            const payload = {
              orderId: order.id,
              version: order.version,
              status,
              note: String(data.get("note") ?? ""),
            };
            setNotice("");
            void run(async () => {
              const updated = await api.call("admin.orders.transition", {
                ...payload,
                idempotencyKey: requestKey(payload),
              });
              onUpdated(updated);
              setNotice(t("Order status updated."));
            });
          }}
        >
          <h3>Cập nhật trạng thái</h3>
          <div className="admin-field-row">
            <label>
              Trạng thái tiếp theo
              <select name="status" defaultValue="" disabled={busy} required>
                <option value="" disabled>
                  Chọn trạng thái
                </option>
                {transitions.map((value) => (
                  <option key={value} value={value}>
                    {t(orderStatusLabels[value])}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ghi chú nhân viên
              <textarea name="note" required maxLength={1000} disabled={busy} />
            </label>
          </div>
          <Button disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu trạng thái"}
          </Button>
        </form>
      )}
      {error && <p role="alert">{t(error)}</p>}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
