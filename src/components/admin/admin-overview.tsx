"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { adminNavigation, can } from "@/lib/access";
import { useRentalApi } from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { AdminData } from "./admin-data";
export function AdminOverview() {
  const { session } = useRentalApi();
  const { t } = useLanguage();
  return (
    <>
      <section className="admin-panel">
        <h2>{t("A clear view of your store")}</h2>
        <p>
          {t("Review customer requests and keep rental statuses up to date.")}
        </p>
      </section>
      {can(session.profile, "orders:manage") && (
        <AdminData operation="admin.orders.list">
          {(orders) => (
            <div className="admin-stats">
              {[
                [
                  "Awaiting review",
                  orders.filter((o) => o.status === "pending").length,
                ],
                [
                  "On rent",
                  orders.filter((o) => o.status === "renting").length,
                ],
                [
                  "Completed",
                  orders.filter((o) => o.status === "completed").length,
                ],
              ].map(([label, count]) => (
                <div className="admin-panel admin-stat" key={label}>
                  <span>{t(String(label))}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </AdminData>
      )}
      <div className="admin-grid">
        {adminNavigation
          .slice(1)
          .filter((item) => can(session.profile, item.permission))
          .map((item) => (
            <Link className="admin-panel" key={item.href} href={item.href}>
              <h3>
                {t(item.label)} <ArrowUpRight size={16} aria-hidden="true" />
              </h3>
              <p>{t("Open workspace")}</p>
            </Link>
          ))}
      </div>
    </>
  );
}
