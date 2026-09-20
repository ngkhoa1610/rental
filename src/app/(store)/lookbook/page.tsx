import { formatPrice, getProduct } from "@/lib/catalog";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";
import { FashionImage } from "@/components/ui/fashion-image";
import Link from "next/link";
import { PageHeading } from "@/components/store/page-heading";
import { SectionButton } from "@/components/ui/section-button";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Lookbook — Rental Store",
  description:
    "Outfit ideas for date nights, vacations and weekends. Explore styling notes and the featured piece behind each look.",
};
const stories = [
  {
    title: "A reason to dress up.",
    occasion: "Date night",
    productSlug: "muse-dress",
    description:
      "A soft pink starting point for dinner, a celebration, or simply making an evening feel special.",
    pairing:
      "Let the dress lead. Keep the rest simple with neutral shoes and a small bag.",
    finishingTouch:
      "Choose one delicate accessory rather than several statement pieces.",
    personalTouch:
      "Swap heels for your favourite flats to make the mood more relaxed.",
  },
  {
    title: "Take the scenic route.",
    occasion: "Vacation",
    productSlug: "luna-set",
    description:
      "One coordinated base, with room to change the mood as your day unfolds.",
    pairing:
      "Wear the set together with a plain inner layer and comfortable shoes.",
    finishingTouch: "A small shoulder bag keeps the silhouette clean and easy.",
    personalTouch:
      "Style the blazer with your own jeans for a second outfit idea.",
  },
  {
    title: "No special occasion needed.",
    occasion: "Weekend",
    productSlug: "soleil-top",
    description:
      "Turn the pieces already in your wardrobe into an outfit for coffee, a walk, or a last-minute plan.",
    pairing:
      "Start with ivory trousers or your favourite denim to balance the pink.",
    finishingTouch:
      "Keep accessories light and let the blouse be the focal point.",
    personalTouch:
      "Try a loose tuck or wear it untucked to find the shape you prefer.",
  },
];

export default function LookbookPage() {
  return (
    <>
      <PageHeading
        title="Wear it your way."
        eyebrow="The lookbook"
        description="Your outfit guide: choose an occasion, try the styling notes, then explore the featured piece. Build the rest with items you already own."
      />
      <div className="store-lookbook-intro">
        <div
          className="store-lookbook-shortcuts"
          role="group"
          aria-label="Jump to an outfit idea"
        >
          {stories.map((story) => (
            <SectionButton
              key={story.productSlug}
              target={`look-${story.productSlug}`}
            >
              {story.occasion} <ArrowDown aria-hidden="true" />
            </SectionButton>
          ))}
        </div>
        <p>
          Styling inspiration · Images and prices are illustrative. Suggested
          accessories are not included with the featured piece.
        </p>
      </div>
      <div className="store-lookbook">
        {stories.map((story, index) => {
          const product = getProduct(story.productSlug);
          if (!product) return null;
          return (
            <article
              key={story.title}
              className="store-story"
              aria-labelledby={`look-${story.productSlug}`}
            >
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
                <h2 id={`look-${story.productSlug}`} tabIndex={-1}>
                  {story.title}
                </h2>
                <p className="store-story-description">{story.description}</p>
                <dl className="store-story-notes">
                  <div>
                    <dt>Pair it with</dt>
                    <dd>{story.pairing}</dd>
                  </div>
                  <div>
                    <dt>Finishing touch</dt>
                    <dd>{story.finishingTouch}</dd>
                  </div>
                  <div>
                    <dt>Make it yours</dt>
                    <dd>{story.personalTouch}</dd>
                  </div>
                </dl>
                <div className="store-story-product">
                  <div>
                    <p className="store-overline">The featured piece</p>
                    <p className="store-story-product-name">{product.name}</p>
                    <p className="store-story-price">
                      Sample · {formatPrice(product.price)} /{" "}
                      {product.rentalDays} days
                    </p>
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="store-text-link"
                  >
                    Explore {product.name} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </ScrollReveal>
            </article>
          );
        })}
      </div>
    </>
  );
}
