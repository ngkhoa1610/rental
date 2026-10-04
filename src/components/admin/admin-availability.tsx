"use client";
import { useCatalogData } from "@/components/store/catalog-data";
import { rentalToday } from "@/lib/rental-dates";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";
import type { InventoryBlock } from "@/lib/api/contracts";
export function AdminAvailability() {
  return (
    <AdminData operation="admin.availability.list">
      {(blocks, reload) => (
        <AvailabilityEditor blocks={blocks} reload={reload} />
      )}
    </AdminData>
  );
}
function AvailabilityEditor({
  blocks,
  reload,
}: {
  blocks: InventoryBlock[];
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage();
  const { api } = useRentalApi();
  const { products } = useCatalogData();
  const { busy, error, run } = useApiAction();
  const key = useRequestKey();
  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <h2>{t("Block inventory")}</h2>
        <p>
          {t(
            "Reserve units for maintenance or cleaning. Existing reservations remain protected.",
          )}
        </p>
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const block = {
              id: "",
              version: 0,
              productSlug: String(data.get("product")),
              quantity: Number(data.get("quantity")),
              pickupDate: String(data.get("start")),
              returnDate: String(data.get("end")),
              reason: String(data.get("reason")),
            };
            void run(async () => {
              await api.call("admin.availability.save", {
                block,
                idempotencyKey: key(block),
              });
              reload("Changes saved in this tab.");
            });
          }}
        >
          <label>
            {t("Product")}
            <select name="product">
              {products.map((p) => (
                <option value={p.slug} key={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Quantity")}
            <input
              name="quantity"
              type="number"
              min={1}
              max={100}
              defaultValue={1}
              required
            />
          </label>
          <label>
            {t("From")}
            <input name="start" type="date" min={rentalToday()} required />
          </label>
          <label>
            {t("Until")}
            <input name="end" type="date" min={rentalToday()} required />
          </label>
          <label>
            {t("Reason")}
            <textarea name="reason" maxLength={500} required />
          </label>
          <Button disabled={busy}>{t("Save block")}</Button>
        </form>
        {error && <p role="alert">{t(error)}</p>}
      </section>
      <section className="admin-panel">
        <h2>{t("Blocked periods")}</h2>
        {!blocks.length && <p>{t("No blocked periods.")}</p>}
        {blocks.map((block) => (
          <article className="admin-record" key={block.id}>
            <h3>
              {block.productSlug} · {block.quantity}
            </h3>
            <p>
              {block.pickupDate} → {block.returnDate}
            </p>
            <p>{block.reason}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api.call("admin.availability.remove", {
                    id: block.id,
                    version: block.version,
                    idempotencyKey: key(block),
                  });
                  reload("Changes saved in this tab.");
                })
              }
            >
              {t("Remove block")}
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
