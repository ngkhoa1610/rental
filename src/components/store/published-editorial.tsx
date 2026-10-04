import { publishedContent, storeProducts } from "@/server/rental/storefront";
import { ProductCard } from "./product-card";
import { PageHeading } from "./page-heading";
export async function PublishedEditorial({
  kind,
}: {
  kind: "collection" | "lookbook";
}) {
  const [records, products] = await Promise.all([
    publishedContent(kind),
    storeProducts(),
  ]);
  return (
    <>
      <PageHeading
        eyebrow={kind === "lookbook" ? "Lookbook" : "Collections"}
        title={kind === "lookbook" ? "Gợi ý phối đồ từ cửa hàng" : "Bộ sưu tập"}
        description="Nội dung và sản phẩm được cửa hàng xuất bản."
      />
      {!records.length && (
        <p role="status">Cửa hàng chưa xuất bản nội dung tại đây.</p>
      )}
      {records.map((record) => (
        <article className="store-api-panel" key={record.id}>
          <h2>{record.title}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{record.body}</p>
          <div className="store-product-grid">
            {products
              .filter((p) => record.productSlugs.includes(p.slug))
              .map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
          </div>
        </article>
      ))}
    </>
  );
}
