import type { Metadata } from "next";
import { Handbag, Gem, Footprints } from "lucide-react";
import { PageHeading } from "@/components/store/page-heading";
import { ContactOptions } from "@/components/store/contact-options";
import { T } from "@/components/store/language-provider";
export const metadata: Metadata = { title: "Thuê phụ kiện — Rental Store" };
export default function AccessoriesPage() {
  return (
    <>
      <PageHeading
        eyebrow="The finishing touches"
        title="Small details. A complete look."
        description="Bags, shoes and jewellery to bring your outfit together. The accessory catalogue is being prepared; ask the store before adding an item to your plans."
      />
      <div className="store-accessory-grid">
        {[
          { icon: Handbag, title: "Bags" },
          { icon: Footprints, title: "Shoes" },
          { icon: Gem, title: "Jewellery" },
        ].map(({ icon: Icon, title }) => (
          <article key={title}>
            <div>
              <Icon aria-hidden="true" />
            </div>
            <h2>
              <T>{title}</T>
            </h2>
            <p>
              <T>
                {
                  "Models, prices and availability are awaiting store confirmation."
                }
              </T>
            </p>
            <ContactOptions
              message={`Nhờ shop tư vấn phụ kiện: ${title}.`}
              label="Ask about accessories"
            />
          </article>
        ))}
      </div>
      <p className="store-api-hint">
        <T>
          {
            "Accessories shown in styling images are not automatically included in a rental."
          }
        </T>
      </p>
    </>
  );
}
