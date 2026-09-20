/** Presentation examples only. Never represent these as verified customer reviews. */
export interface Feedback {
  readonly id: string;
  readonly name: string;
  readonly quote: string;
  readonly occasion: string;
  readonly rating: number;
  readonly tone: "pink" | "cream" | "ink" | "lilac" | "lime";
  readonly productSlug?: string;
}

export const sampleFeedback: readonly Feedback[] = [
  {
    id: "invitation",
    name: "Mai",
    occasion: "Wedding guest",
    rating: 5,
    tone: "pink",
    quote: "Came for a dress. Left with main-character energy.",
  },
  {
    id: "weekend",
    name: "Linh",
    occasion: "Weekend plans",
    rating: 5,
    tone: "cream",
    productSlug: "luna-set",
    quote: "One outfit. A whole camera roll of good memories.",
  },
  {
    id: "repeat",
    name: "An",
    occasion: "Date night",
    rating: 5,
    tone: "ink",
    quote: "The best part? Feeling completely like myself.",
  },
  {
    id: "little-details",
    name: "Vy",
    occasion: "Everyday moments",
    rating: 4,
    tone: "lilac",
    quote:
      "Love a little wardrobe adventure. More fit details would make choosing even easier.",
  },
  {
    id: "dress-up",
    name: "Nhi",
    occasion: "Just because",
    rating: 5,
    tone: "cream",
    productSlug: "muse-dress",
    quote: "No big occasion. Just a very good outfit day.",
  },
  {
    id: "new-mood",
    name: "Minh",
    occasion: "A fresh start",
    rating: 5,
    tone: "lime",
    quote: "New look, same me. A little more fearless.",
  },
];

export interface FeedbackDraft {
  name: string;
  quote: string;
  rating: string;
}

export function validateFeedback(draft: FeedbackDraft): string | null {
  if (!draft.name.trim() || draft.name.trim().length > 40)
    return "Add a name between 1 and 40 characters.";
  const length = draft.quote.trim().length;
  if (length < 10 || length > 500)
    return "Write between 10 and 500 characters about your experience.";
  if (!/^[1-5]$/.test(draft.rating)) return "Choose a rating from 1 to 5.";
  return null;
}

/** Preview text is never treated as markup or encoded in the page URL. */
export function feedbackShareText(
  feedback: Pick<Feedback, "name" | "quote" | "rating">,
  sample = false,
): string {
  const label = sample
    ? "Illustrative feedback — not a verified customer review"
    : "My feedback draft — not published on Rental Store";
  return `${label}\n“${feedback.quote}”\n— ${feedback.name} · ${feedback.rating}/5\nRental Store`;
}
