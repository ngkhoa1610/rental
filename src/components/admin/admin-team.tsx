"use client";
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
  return (
    <AdminData operation="admin.staff.list">
      {(members, reload) => (
        <div className="admin-grid">
          {members.map((member) => (
            <MemberEditor key={member.id} member={member} reload={reload} />
          ))}
        </div>
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
    <section className="admin-panel">
      <h2>{member.name}</h2>
      {owner ? (
        <p>{t("Owner account · protected")}</p>
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
              reload("Changes saved in this tab.");
            });
          }}
        >
          <label className="admin-check">
            <input
              type="checkbox"
              name="active"
              defaultChecked={member.active}
            />
            {t("Active account")}
          </label>
          <fieldset>
            <legend>{t("Task permissions")}</legend>
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
                  {t(permissionLabels[p])}
                </label>
              ))}
          </fieldset>
          <Button disabled={busy}>{t("Save permissions")}</Button>
          {error && <p role="alert">{t(error)}</p>}
        </form>
      )}
    </section>
  );
}
