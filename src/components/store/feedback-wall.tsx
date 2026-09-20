"use client";

import { useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FashionImage } from "@/components/ui/fashion-image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getProduct } from "@/lib/catalog";
import {
  feedbackShareText,
  sampleFeedback,
  validateFeedback,
  type Feedback,
  type FeedbackDraft,
} from "@/lib/feedback";

const emptyDraft: FeedbackDraft = { name: "", quote: "", rating: "5" };

export function FeedbackWall() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [preview, setPreview] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const focusPreviewOnClose = useRef(false);
  const previewHeading = useRef<HTMLHeadingElement>(null);

  return (
    <div className="feedback-page">
      <header className="feedback-hero">
        <div className="feedback-kicker">
          <span aria-hidden="true" /> THE FEEDBACK WALL / VOL. 01
        </div>
        <h1>
          Good looks.
          <br />
          <span>Great stories.</span>
          <Sparkles aria-hidden="true" />
        </h1>
        <div className="feedback-hero-bottom">
          <p>
            The outfit is only half the story.
            <br />
            The rest? That’s all you.
          </p>
          <Sheet
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              setError(null);
            }}
          >
            <SheetTrigger asChild>
              <Button className="feedback-write">
                <Plus aria-hidden="true" /> Your words belong here
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="feedback-composer"
              onCloseAutoFocus={(event) => {
                if (focusPreviewOnClose.current && previewHeading.current) {
                  event.preventDefault();
                  previewHeading.current.focus();
                  focusPreviewOnClose.current = false;
                }
              }}
            >
              <SheetHeader className="p-0 pr-8">
                <SheetTitle className="text-2xl font-bold">
                  Tell your outfit story.
                </SheetTitle>
                <SheetDescription>
                  Create a private preview, then share your words. Nothing is
                  posted publicly. Reloading this page clears your draft.
                </SheetDescription>
              </SheetHeader>
              <form
                className="feedback-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  const message = validateFeedback(draft);
                  setError(message);
                  if (message) return;
                  setPreview({
                    id: "your-preview",
                    name: draft.name.trim(),
                    quote: draft.quote.trim(),
                    rating: Number(draft.rating),
                    occasion: "Your story",
                    tone: "pink",
                  });
                  focusPreviewOnClose.current = true;
                  setOpen(false);
                }}
              >
                <label htmlFor="feedback-name">
                  Your name
                  <input
                    id="feedback-name"
                    autoComplete="given-name"
                    value={draft.name}
                    maxLength={40}
                    required
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <fieldset>
                  <legend>Your rating</legend>
                  <div className="feedback-rating-input">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <label key={rating}>
                        <input
                          type="radio"
                          name="feedback-rating"
                          value={rating}
                          checked={draft.rating === String(rating)}
                          onChange={(event) =>
                            setDraft({ ...draft, rating: event.target.value })
                          }
                        />
                        <span>
                          {rating}
                          <Star aria-hidden="true" />
                          <span className="sr-only"> out of 5 stars</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="feedback-quote">
                  Your story
                  <textarea
                    id="feedback-quote"
                    value={draft.quote}
                    minLength={10}
                    maxLength={500}
                    required
                    rows={4}
                    aria-describedby="feedback-count"
                    onChange={(event) =>
                      setDraft({ ...draft, quote: event.target.value })
                    }
                    placeholder="The little details. The big feelings. The honest bits."
                  />
                </label>
                <p id="feedback-count" className="feedback-form-hint">
                  {draft.quote.length}/500 · Please leave out private contact or
                  booking details.
                </p>
                {error && (
                  <p role="alert" className="feedback-form-error">
                    {error}
                  </p>
                )}
                <div className="feedback-form-actions">
                  <SheetClose asChild>
                    <Button variant="outline" type="button">
                      Keep editing later
                    </Button>
                  </SheetClose>
                  <Button type="submit">
                    Preview my feedback <ArrowUpRight aria-hidden="true" />
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <span className="feedback-sticker" aria-hidden="true">
          a little
          <br />
          outspoken ✳
        </span>
      </header>

      {preview && (
        <section
          className="feedback-preview"
          aria-labelledby="feedback-preview-heading"
        >
          <h2 id="feedback-preview-heading" ref={previewHeading} tabIndex={-1}>
            Your private preview
          </h2>
          <p>
            Only visible here until you leave or reload. Share it when you’re
            ready; this does not publish it to the wall.
          </p>
          <FeedbackCard feedback={preview} sample={false} />
        </section>
      )}

      <div className="feedback-wall-heading">
        <h2>
          A little love. A lot of personality.{" "}
          <ArrowDownRight aria-hidden="true" />
        </h2>
        <p>
          Design preview · All stories below are illustrative, not verified
          customer reviews. Photos are styling images.
        </p>
      </div>
      <section
        className="feedback-grid"
        aria-label="Illustrative feedback stories"
      >
        {sampleFeedback.map((feedback, index) => (
          <ScrollReveal
            key={feedback.id}
            className="feedback-item"
            delay={(index % 2) * 55}
          >
            <FeedbackCard feedback={feedback} sample />
          </ScrollReveal>
        ))}
      </section>
      <ScrollReveal>
        <aside className="feedback-outro">
          <MessageCircle aria-hidden="true" />
          <p>
            Big feelings.
            <br />
            <strong>No perfect words required.</strong>
          </p>
          <span>THE GOOD. THE COULD-BE-BETTER. ALL OF IT.</span>
        </aside>
      </ScrollReveal>
    </div>
  );
}

function FeedbackCard({
  feedback,
  sample,
}: {
  feedback: Feedback;
  sample: boolean;
}) {
  const product = feedback.productSlug
    ? getProduct(feedback.productSlug)
    : undefined;
  return (
    <article
      className={`feedback-card feedback-card-${feedback.tone}${product ? " feedback-card-with-photo" : ""}`}
      aria-label={`${sample ? "Illustrative feedback" : "Private feedback preview"} by ${feedback.name}`}
    >
      {product && (
        <div className="feedback-photo">
          <FashionImage
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 767px) 90vw, (max-width: 1099px) 45vw, 220px"
          />
        </div>
      )}
      <div className="feedback-card-content">
        <div className="feedback-card-top">
          <span>{sample ? "SAMPLE STORY" : "PRIVATE PREVIEW"}</span>
          <span
            className="feedback-stars"
            aria-label={`${feedback.rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                fill={index < feedback.rating ? "currentColor" : "none"}
              />
            ))}
          </span>
        </div>
        <blockquote>
          <p>“{feedback.quote}”</p>
        </blockquote>
        <footer>
          <div>
            <span className="feedback-author">
              {feedback.name}
              <span aria-hidden="true"> ↗</span>
            </span>
            <span className="feedback-occasion">{feedback.occasion}</span>
          </div>
          <FeedbackShare
            key={`${feedback.name}:${feedback.rating}:${feedback.quote}`}
            feedback={feedback}
            sample={sample}
          />
        </footer>
      </div>
    </article>
  );
}

function FeedbackShare({
  feedback,
  sample,
}: {
  feedback: Feedback;
  sample: boolean;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualText, setManualText] = useState("");
  const copyField = useRef<HTMLTextAreaElement>(null);
  async function share() {
    const text = feedbackShareText(feedback, sample);
    setBusy(true);
    setStatus("");
    setManualText("");
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "An outfit story — Rental Store",
            text,
          });
          setStatus("Share request completed.");
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            setStatus("Sharing cancelled.");
            return;
          }
        }
      }
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatus("Feedback copied. Paste it wherever you like.");
    } catch {
      setManualText(text);
      setStatus(
        "Automatic sharing is unavailable. Select and copy your text below.",
      );
      requestAnimationFrame(() => {
        copyField.current?.focus();
        copyField.current?.select();
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="feedback-share">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        aria-label={`Share ${sample ? "illustrative feedback" : "private feedback"} by ${feedback.name}`}
      >
        {status.startsWith("Feedback copied") ? (
          <Check aria-hidden="true" />
        ) : (
          <Share2 aria-hidden="true" />
        )}
        {busy ? "Sharing…" : "Share"}
      </button>
      <p role="status">{status}</p>
      {manualText && (
        <label className="feedback-manual-copy">
          <Copy aria-hidden="true" /> Text to copy
          <textarea ref={copyField} readOnly value={manualText} rows={5} />
        </label>
      )}
    </div>
  );
}
