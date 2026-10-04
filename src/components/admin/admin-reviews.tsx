"use client";
import Image from "next/image";
import type { CustomerReview } from "@/lib/api/contracts";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";
export function AdminReviews() {
  const { t } = useLanguage();
  return (
    <AdminData operation="admin.reviews.list">
      {(reviews, reload) => (
        <div className="admin-grid">
          {reviews.map((review) => (
            <ReviewEditor key={review.id} review={review} reload={reload} />
          ))}
          {!reviews.length && <p>{t("No reviews to moderate.")}</p>}
        </div>
      )}
    </AdminData>
  );
}
function ReviewEditor({
  review,
  reload,
}: {
  review: CustomerReview;
  reload: (notice?: string) => void;
}) {
  const { t } = useLanguage();
  const { api } = useRentalApi();
  const { busy, error, run } = useApiAction();
  const key = useRequestKey();
  return (
    <section className="admin-panel">
      <h2>
        {review.orderId} · {review.rating}/5
      </h2>
      <p>{review.story}</p>
      {review.mediaIds.map((id) => (
        <Image
          key={id}
          src={`/media/${id}`}
          alt="Ảnh khách gửi"
          width={320}
          height={400}
          unoptimized
          style={{ width: "100%", height: "auto" }}
        />
      ))}
      <p>
        {t(
          review.consentToPublish
            ? "Publication consent received"
            : "No publication consent",
        )}{" "}
        · {t(review.moderation)}
      </p>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const input = {
            id: review.id,
            version: review.version,
            decision: String(data.get("decision")) as "approved" | "rejected",
            note: String(data.get("note")),
          };
          void run(async () => {
            await api.call("admin.reviews.moderate", {
              ...input,
              idempotencyKey: key(input),
            });
            reload("Changes saved in this tab.");
          });
        }}
      >
        <label>
          {t("Decision")}
          <select name="decision">
            <option value="rejected">{t("Reject")}</option>
            <option value="approved" disabled={!review.consentToPublish}>
              {t("Approve")}
            </option>
          </select>
        </label>
        <label>
          {t("Reason")}
          <textarea
            name="note"
            required
            maxLength={500}
            defaultValue={review.moderationNote}
          />
        </label>
        <Button disabled={busy}>{t("Save decision")}</Button>
        {error && <p role="alert">{t(error)}</p>}
      </form>
    </section>
  );
}
