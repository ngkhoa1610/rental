import { getProduct } from "@/lib/catalog";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";
import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
import { PageHeading } from "@/components/store/page-heading";

export const metadata: Metadata = { title: "Lookbook — Rental Store" };
const stories = [
  {
    title: "A reason to dress up.",
    occasion: "Date night",
    productSlug: "muse-dress",
  },
  {
    title: "Take the scenic route.",
    occasion: "Vacation",
    productSlug: "luna-set",
  },
  {
    title: "No special occasion needed.",
    occasion: "Weekend",
    productSlug: "soleil-top",
  },
];

export default function LookbookPage() {
  return (
    <>
      <PageHeading
        title="Wear it your way."
        eyebrow="The lookbook"
        description="A few ideas for your next plan. Editorial imagery for inspiration, not photographs of confirmed rental inventory."
      />
      <div className="store-lookbook">
        {stories.map((story, index) => {
          const product = getProduct(story.productSlug);
          if (!product) return null;
          return (
            <article key={story.title} className="store-story">
              <div className="store-story-photo">
                <FashionImage
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 560px"
                />
              </div>
              <ScrollReveal>
                <p className="store-overline">
                  0{index + 1} / {story.occasion}
                </p>
                <h2>{story.title}</h2>
                <Link
                  href={`/products/${product.slug}`}
                  className="store-text-link"
                >
                  View {product.name}
                </Link>
              </ScrollReveal>
            </article>
          );
        })}
      </div>
    </>
  );
}
