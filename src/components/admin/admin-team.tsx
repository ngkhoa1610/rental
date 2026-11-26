"use client";
import { useState } from "react";
import type { StaffMember, Permission } from "@/lib/api/contracts";
import { permissions, permissionLabels } from "@/lib/access";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";
export function AdminTeam() {
  const [status, setStatus] = useState("");
  return (
    <AdminData operation="admin.staff.list">
      {(members, reload) => (
        <>
          <label className="admin-form">
            Trạng thái nhân sự
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã vô hiệu hóa</option>
            </select>
          </label>
          <div className="admin-grid">
            {members
              .filter(
                (member) => !status || member.active === (status === "active"),
              )
              .map((member) => (
                <MemberEditor key={member.id} member={member} reload={reload} />
              ))}
            {!members.some(
              (member) => !status || member.active === (status === "active"),
            ) && <p>Không có nhân sự phù hợp.</p>}
          </div>
        </>
      )}
    </AdminData>
  );
}
function MemberEditor({
  member,
  reload,
}: {
  member: StaffMember;
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage();
  const { api, session } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const key = useRequestKey();
  const owner =
    member.id === session.profile?.id ||
    member.permissions.includes("staff:manage");
  return (
    <section className="admin-surface">
      <h2>{member.name}</h2>
      <p>{member.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}</p>
      {owner ? (
        <p>Tài khoản quản trị được bảo vệ.</p>
      ) : (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const input = {
              id: member.id,
              version: member.version,
              active: data.has("active"),
              permissions: data.getAll("permissions") as Permission[],
            };
            void run(async () => {
              await api.call("admin.staff.update", {
                ...input,
                idempotencyKey: key(input),
              });
              reload("Đã lưu quyền.");
            });
          }}
        >
          <label className="admin-check">
            <input
              type="checkbox"
              name="active"
              defaultChecked={member.active}
            />
            Tài khoản hoạt động
          </label>
          <fieldset>
            <legend>Quyền tác vụ</legend>
            {permissions
              .filter((p) => p !== "staff:manage")
              .map((p) => (
                <label className="admin-check" key={p}>
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p}
                    defaultChecked={member.permissions.includes(p)}
                  />
                  {t(permissionLabels[p] ?? p)}
                </label>
              ))}
          </fieldset>
          <Button disabled={busy}>Lưu quyền</Button>
          {error && <p role="alert">{t(error)}</p>}
        </form>
      )}
    </section>
  );
}
