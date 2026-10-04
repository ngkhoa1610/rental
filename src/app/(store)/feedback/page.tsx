import { PublishedReviews } from "@/components/store/published-reviews";
import { isLiveStore } from "@/server/rental/storefront";
import type { Metadata } from "next";
import { FeedbackWall } from "@/components/store/feedback-wall";
import "./feedback.css";

export const metadata: Metadata = {
  title: "The Feedback Wall — Rental Store",
  description:
    "Outfit stories, little moments and room for your own words. Explore the Rental Store feedback wall.",
};

export default function FeedbackPage() {
  return isLiveStore() ? <PublishedReviews /> : <FeedbackWall />;
}
