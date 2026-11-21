"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/lib/order-workflow";
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
  const [selected, setSelected] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase("vi");
  const phone = query.replace(/\D/g, "");
  const filtered = customers.filter(
    (p) =>
      p.name.toLocaleLowerCase("vi").includes(query) ||
      (phone &&
        /^[+\d ().-]+$/.test(query) &&
        p.phone.replace(/\D/g, "").includes(phone)),
  );
  return (
    <>
      <label className="admin-form">
        Tìm theo tên hoặc số điện thoại
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      {!filtered.length && <p>Không tìm thấy khách hàng.</p>}
      <div className="admin-grid">
        {filtered.map((profile) => (
          <section key={profile.id} className="admin-surface">
            <h2>{profile.name || "Khách chưa có tên"}</h2>
            <p>{profile.phone || "Chưa có số điện thoại"}</p>
            {can(session.profile, "orders:manage") && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={selected === profile.id}
                  onClick={() =>
                    setSelected(selected === profile.id ? null : profile.id)
                  }
                >
                  Lịch sử thuê
                </Button>
                {selected === profile.id && (
                  <AdminData operation="admin.orders.list" showRefresh={false}>
                    {(orders) => (
                      <>
                        {orders
                          .filter((o) => o.customerId === profile.id)
                          .map((order) => (
                            <p key={order.id}>
                              <Link
                                href={`/admin/orders?order=${encodeURIComponent(order.id)}`}
                              >
                                {order.id}
                              </Link>
                              {" · "}
                              {order.pickupDate} – {order.returnDate} ·{" "}
                              {t(orderStatusLabels[order.status])}
                            </p>
                          ))}
                        {!orders.some((o) => o.customerId === profile.id) && (
                          <p>Chưa có đơn thuê.</p>
                        )}
                      </>
                    )}
                  </AdminData>
                )}
              </>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
