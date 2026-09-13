import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeading } from "@/components/store/page-heading";

export const metadata: Metadata = { title: "Lookbook — Rental Store" };
const stories = [
  {
    title: "A reason to dress up.",
    occasion: "Date night",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=90",
    alt: "Outdoor fashion portrait in a light summer dress",
  },
  {
    title: "Take the scenic route.",
    occasion: "Vacation",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=90",
    alt: "Street-style editorial with patterned clothing",
  },
  {
    title: "No special occasion needed.",
    occasion: "Weekend",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90",
    alt: "Mustard outfit photographed in a city setting",
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
        {stories.map((story, index) => (
          <article key={story.title} className="store-story">
            <div className="store-story-photo">
              <Image
                src={story.image}
                alt={story.alt}
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
                href={`/products?occasion=${encodeURIComponent(story.occasion)}`}
                className="store-text-link"
              >
                Explore {story.occasion.toLowerCase()} looks
              </Link>
            </ScrollReveal>
          </article>
        ))}
      </div>
    </>
  );
}
