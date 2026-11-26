import { PublishedReviews } from "@/components/store/published-reviews";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Feedback Wall — Rental Store",
  description:
    "Outfit stories, little moments and room for your own words. Explore the Rental Store feedback wall.",
};

export default function FeedbackPage() {
  return <PublishedReviews />;
}
