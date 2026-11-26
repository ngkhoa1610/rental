"use client";
import Image from "next/image";
import { useState } from "react";
import type { CustomerReview } from "@/lib/api/contracts";
import {
  useApiAction,
  useRentalApi,
  useRequestKey,
} from "@/components/store/api-provider";
import { useLanguage } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
import { AdminData } from "./admin-data";
const moderationLabels = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
} as const;
export function AdminReviews() {
  const [status, setStatus] = useState("");
  return (
    <AdminData operation="admin.reviews.list">
      {(reviews, reload) => (
        <>
          <label className="admin-form">
            Trạng thái duyệt
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Tất cả</option>
              {Object.entries(moderationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-grid">
            {reviews
              .filter((review) => !status || review.moderation === status)
              .map((review) => (
                <ReviewEditor key={review.id} review={review} reload={reload} />
              ))}
            {!reviews.some(
              (review) => !status || review.moderation === status,
            ) && <p>Không có feedback phù hợp.</p>}
          </div>
        </>
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
    <section className="admin-surface">
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
        {review.consentToPublish
          ? "Khách đồng ý công khai"
          : "Khách chưa đồng ý công khai"}
        {" · "}
        {moderationLabels[review.moderation]}
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
            reload("Đã lưu quyết định.");
          });
        }}
      >
        <label>
          Quyết định
          <select name="decision" required defaultValue="">
            <option value="" disabled>
              Chọn quyết định
            </option>
            <option value="rejected">Từ chối</option>
            <option value="approved" disabled={!review.consentToPublish}>
              Duyệt
            </option>
          </select>
        </label>
        <label>
          Lý do
          <textarea
            name="note"
            required
            maxLength={500}
            defaultValue={review.moderationNote}
          />
        </label>
        <Button disabled={busy}>Lưu quyết định</Button>
        {error && <p role="alert">{t(error)}</p>}
      </form>
    </section>
  );
}
