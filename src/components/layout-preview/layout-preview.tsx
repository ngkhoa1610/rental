import type { ComponentProps } from "react";
import { AdminOrdersTable } from "@/components/admin/admin-orders";
import { T } from "@/components/store/language-provider";
import { PageHeading } from "@/components/store/page-heading";
import { ProductCardLayout } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { orderStatusLabels } from "@/lib/order-workflow";
import { PreviewDateFields } from "./preview-date-fields";
import { PreviewSignIn, type PreviewAccounts } from "./preview-sign-in";

type PreviewOrder = ComponentProps<typeof AdminOrdersTable>["orders"][number];

interface PreviewData {
  accounts: PreviewAccounts;
  products: (ComponentProps<typeof ProductCardLayout>["product"] & {
    slug: string;
  })[];
  availability: { date: string; label: string }[];
  orders: (Omit<PreviewOrder, "status"> & { status: string })[];
  reviews: { id: string; rating: number; story: string }[];
}

export function LayoutPreview({ data }: { data: PreviewData }) {
  const [featured] = data.products;
  const orders = data.orders.map((order): PreviewOrder => {
    if (!Object.hasOwn(orderStatusLabels, order.status)) {
      throw new Error("Trạng thái đơn mẫu không hợp lệ.");
    }
    return { ...order, status: order.status as PreviewOrder["status"] };
  });

  return (
    <div className="landing-page store-theme-preview">
      <a className="home-skip" href="#preview-main">
        Bỏ qua đến nội dung
      </a>
      <main
        id="preview-main"
        tabIndex={-1}
        className="home-container store-main space-y-12"
      >
        <PageHeading
          eyebrow="Môi trường phát triển"
          title="Xem trước bố cục"
          description="Dữ liệu mẫu hiển thị trực tiếp trên các bố cục cửa hàng và quản trị."
        />

        <PreviewSignIn
          accounts={data.accounts}
          customer={
            <>
              <section
                aria-labelledby="preview-orders-heading"
                className="space-y-6"
              >
                <h2
                  id="preview-orders-heading"
                  className="text-2xl font-semibold"
                >
                  Đơn thuê của khách
                </h2>
                <div className="store-product-grid">
                  {orders.slice(0, 3).map((order) => (
                    <article key={order.id} className="store-order-card">
                      <header className="store-receipt-header">
                        <div className="store-receipt-title">
                          <h3>Yêu cầu thuê</h3>
                          <span
                            className="store-api-badge"
                            data-status={order.status}
                          >
                            <T>{orderStatusLabels[order.status]}</T>
                          </span>
                        </div>
                        <p className="store-receipt-number">#{order.id}</p>
                      </header>
                      <dl className="store-receipt-details">
                        <div>
                          <dt>Khách thuê</dt>
                          <dd>{order.contact.name}</dd>
                        </div>
                        <div>
                          <dt>Thời gian thuê</dt>
                          <dd>
                            <time dateTime={order.pickupDate}>
                              {order.pickupDate}
                            </time>
                            {" – "}
                            <time dateTime={order.returnDate}>
                              {order.returnDate}
                            </time>
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>

              <section
                aria-labelledby="preview-feedback-heading"
                className="space-y-6"
              >
                <h2
                  id="preview-feedback-heading"
                  className="text-2xl font-semibold"
                >
                  Phản hồi
                </h2>
                <div className="store-product-grid">
                  {data.reviews.map(({ id, rating, story }) => (
                    <article className="store-api-panel" key={id}>
                      <p>Đánh giá {rating}/5</p>
                      <p>{story}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          }
          admin={
            <section
              aria-labelledby="preview-admin-heading"
              className="admin-panel"
            >
              <h2 id="preview-admin-heading">Đơn thuê trong Admin</h2>
              <AdminOrdersTable orders={orders} />
            </section>
          }
        />

        <section
          aria-labelledby="preview-catalog-heading"
          className="space-y-6"
        >
          <h2 id="preview-catalog-heading" className="text-2xl font-semibold">
            Danh mục trang phục
          </h2>
          <div className="store-product-grid">
            {data.products.map((product) => (
              <ProductCardLayout key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="preview-product-heading"
          className="space-y-6"
        >
          <h2 id="preview-product-heading" className="text-2xl font-semibold">
            Chi tiết và lịch thuê
          </h2>
          <div className="store-detail-grid">
            {featured && (
              <ProductGallery
                name={featured.name}
                image={featured.image}
                alt={featured.imageAlt}
              />
            )}
            <div className="min-w-0 space-y-6">
              <div className="store-api-panel">
                <h3 className="font-semibold">Ngày thuê</h3>
                <PreviewDateFields />
                <dl className="store-receipt-details">
                  {data.availability.map(({ date, label }) => (
                    <div key={date}>
                      <dt>
                        <time dateTime={date}>{date}</time>
                      </dt>
                      <dd>{label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
