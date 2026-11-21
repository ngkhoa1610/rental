"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  PackageCheck,
} from "lucide-react";
import { adminNavigation, can } from "@/lib/access";
import type { RentalOrder } from "@/lib/api/contracts";
import { rentalToday } from "@/lib/rental-dates";
import { useRentalApi } from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { AdminData } from "./admin-data";
import {
  OrderBadge,
  formatOrderDate,
  orderQueues,
  ordersInQueue,
} from "./admin-orders";

const queueIcons = {
  pending: ClipboardList,
  pickup: PackageCheck,
  return: CalendarCheck,
  overdue: CalendarClock,
};

export function AdminOverview() {
  const { session } = useRentalApi();
  const { t } = useLanguage();
  const sections = adminNavigation
    .slice(1)
    .filter((item) => can(session.profile, item.permission));

  return (
    <>
      {can(session.profile, "orders:manage") && (
        <AdminData operation="admin.orders.list">
          {(orders) => <DailyOrders orders={orders} />}
        </AdminData>
      )}
      <section
        className="admin-surface admin-panel"
        aria-labelledby="admin-overview-sections"
      >
        <h2 id="admin-overview-sections">Khu vực quản lý</h2>
        <nav
          className="admin-page-actions admin-overview-links"
          aria-label="Khu vực quản lý"
        >
          {sections.map((item) => (
            <Link key={item.href} href={item.href}>
              {t(item.label)}{" "}
              <ArrowUpRight aria-hidden="true" width={16} height={16} />
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}

function DailyOrders({ orders }: { orders: RentalOrder[] }) {
  const today = rentalToday();
  const queues = orderQueues.map((queue) => ({
    ...queue,
    orders: ordersInQueue(orders, queue.key, today),
  }));
  return (
    <>
      <div className="admin-page-actions admin-overview-heading">
        <h2>Việc cần xử lý</h2>
        <time dateTime={today}>{formatOrderDate(today)} · Giờ Việt Nam</time>
      </div>
      <div className="admin-stats admin-queue-grid">
        {queues.map(({ key, label, orders }) => {
          const Icon = queueIcons[key];
          return (
            <Link
              className="admin-stat admin-panel admin-queue-card"
              data-queue={key}
              key={key}
              href={"/admin/orders?queue=" + key}
            >
              <Icon aria-hidden="true" width={20} height={20} />
              <span>{label}</span>
              <strong>{orders.length}</strong>
              <ArrowUpRight aria-hidden="true" width={16} height={16} />
            </Link>
          );
        })}
      </div>
      <div className="admin-grid admin-overview-queues">
        {queues.map(({ key, label, empty, orders }) => (
          <section
            className="admin-surface admin-panel"
            key={key}
            aria-label={label}
          >
            <div className="admin-page-actions">
              <h3>{label}</h3>
              {orders.length > 0 && (
                <Link href={"/admin/orders?queue=" + key}>Xem danh sách</Link>
              )}
            </div>
            {orders.length ? (
              <ul className="admin-record-list">
                {orders.slice(0, 4).map((order) => (
                  <li className="admin-record" key={order.id}>
                    <Link
                      className="admin-page-actions admin-queue-row"
                      href={
                        "/admin/orders?queue=" +
                        key +
                        "&order=" +
                        encodeURIComponent(order.id)
                      }
                    >
                      <span>
                        <strong>{order.contact.name}</strong>
                        <br />
                        {order.id}
                      </span>
                      {key === "pending" ? (
                        <OrderBadge status={order.status} />
                      ) : (
                        <time
                          dateTime={
                            key === "pickup"
                              ? order.pickupDate
                              : order.returnDate
                          }
                        >
                          {formatOrderDate(
                            key === "pickup"
                              ? order.pickupDate
                              : order.returnDate,
                          )}
                        </time>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{empty}</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
