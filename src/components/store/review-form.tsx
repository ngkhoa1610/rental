"use client";
import { useRef, useState } from "react";
import type { RentalOrder } from "@/lib/api/contracts";
import { uploadImage } from "@/lib/api/upload-image";
import { useApiAction, useRentalApi, useRequestKey } from "./api-provider";
import { useLanguage } from "./language-provider";
import { Button } from "@/components/ui/button";
export function ReviewForm({
  order,
  onUpdated,
}: {
  order: RentalOrder;
  onUpdated: (o: RentalOrder) => void;
}) {
  const { api, demo, session } = useRentalApi(),
    { t } = useLanguage(),
    { busy, error, run } = useApiAction(),
    key = useRequestKey();
  const [files, setFiles] = useState<File[]>([]);
  const uploaded = useRef(new Map<File, string>());
  if (order.review)
    return (
      <p role="status">
        {t("Your review")} · {t(order.review.moderation)}
      </p>
    );
  const invalid = files.length > 3 || files.some((f) => f.size > 4194304);
  return (
    <details className="store-api-panel">
      <summary>{t("Review this rental")}</summary>
      <form
        className="store-api-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(async () => {
            const mediaIds: string[] = [];
            for (const file of files) {
              let id = uploaded.current.get(file);
              if (!id) {
                id = await uploadImage(file, session.csrfToken, order.id);
                uploaded.current.set(file, id);
              }
              mediaIds.push(id);
            }
            const input = {
              orderId: order.id,
              rating: Number(data.get("rating")),
              story: String(data.get("story")),
              consentToPublish: data.has("consent"),
              mediaIds,
            };
            const review = await api.call("reviews.create", {
              ...input,
              idempotencyKey: key(input),
            });
            onUpdated({ ...order, review });
          });
        }}
      >
        <label>
          {t("Rating")}
          <select name="rating" defaultValue="5" disabled={busy}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}/5
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Your rental experience")}
          <textarea name="story" required maxLength={2000} disabled={busy} />
        </label>
        {!demo && (
          <label>
            {t("Photos (optional, up to 3)")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
        )}
        {invalid && (
          <p role="alert">{t("Choose at most 3 photos, up to 4 MB each.")}</p>
        )}
        <label>
          <input name="consent" type="checkbox" disabled={busy} />
          {t(
            "I agree to publish this review and the attached photos after moderation.",
          )}
        </label>
        <Button disabled={busy || invalid}>{t("Send review")}</Button>
        {error && <p role="alert">{t(error)}</p>}
      </form>
    </details>
  );
}
