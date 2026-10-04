import Image from "next/image";
import { connection } from "next/server";
import { getDatabase } from "@/server/db/client";
import { PageHeading } from "./page-heading";
export async function PublishedReviews() {
  await connection();
  const reviews = await getDatabase().customerReview.findMany({
    where: {
      moderation: "approved",
      consentToPublish: true,
      order: { status: "completed" },
    },
    select: {
      id: true,
      rating: true,
      story: true,
      media: {
        select: { storageKey: true, alt: true },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeading
        title="Chuyện mặc đẹp của khách"
        eyebrow="Feedback"
        description="Đánh giá từ đơn thuê hoàn tất, được khách đồng ý công khai và cửa hàng duyệt."
      />
      {!reviews.length && <p role="status">Chưa có đánh giá được công khai.</p>}
      <div className="store-product-grid">
        {reviews.map((review) => (
          <article className="store-api-panel" key={review.id}>
            <p>Đã thuê · {review.rating}/5</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{review.story}</p>
            {review.media.map((m) => (
              <Image
                key={m.storageKey}
                src={"/media/" + m.storageKey}
                alt={m.alt}
                width={400}
                height={500}
                unoptimized
                style={{ width: "100%", height: "auto" }}
              />
            ))}
          </article>
        ))}
      </div>
    </>
  );
}
