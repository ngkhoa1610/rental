"use client";
import { useState } from "react";
import type { Profile } from "@/lib/api/contracts";
import { useLanguage } from "@/components/store/language-provider";
import { useRentalApi } from "@/components/store/api-provider";
import { can } from "@/lib/access";
import { AdminData } from "./admin-data";
export function AdminCustomers() {
  return (
    <AdminData operation="admin.customers.list">
      {(customers) => <CustomerList customers={customers} />}
    </AdminData>
  );
}
function CustomerList({ customers }: { customers: Profile[] }) {
  const { t } = useLanguage();
  const { session } = useRentalApi();
  const [search, setSearch] = useState("");
  const filtered = customers.filter((p) =>
    `${p.name} ${p.phone}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <label className="admin-form">
        {t("Search name or phone")}
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      {!filtered.length && <p>{t("No matching customers.")}</p>}
      <div className="admin-grid">
        {filtered.map((profile) => (
          <section key={profile.id} className="admin-panel">
            <h2>{profile.name}</h2>
            <p>{profile.phone || t("No contact number")}</p>
            {can(session.profile, "orders:manage") && (
              <details>
                <summary>{t("Rental history")}</summary>
                <AdminData operation="admin.orders.list">
                  {(orders) => (
                    <>
                      {orders
                        .filter((o) => o.customerId === profile.id)
                        .map((order) => (
                          <p key={order.id}>
                            {order.id} · {order.pickupDate} · {t(order.status)}
                          </p>
                        ))}
                      {!orders.some((o) => o.customerId === profile.id) && (
                        <p>{t("No requests yet")}</p>
                      )}
                    </>
                  )}
                </AdminData>
              </details>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
