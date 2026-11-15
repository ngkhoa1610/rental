"use client";
import { useCatalogData } from "./catalog-data";
import { T, useLanguage } from "@/components/store/language-provider";

import { RentalDateFields } from "./rental-date-fields";
import { rentalDateError } from "@/lib/rental-dates";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog";
import type { Quote, RentalOrder } from "@/lib/api/contracts";
import { useApiAction, useRentalApi, useRequestKey } from "./api-provider";
import { SessionPanel } from "./session-panel";
import { BookingConfirmation } from "./booking-confirmation";
import { requestNotes } from "@/lib/store-details";

export function RentalRequest({
  slugs,
  advice = "",
}: {
  slugs: readonly string[];
  advice?: string;
}) {
  const { t } = useLanguage();
  const { products } = useCatalogData();
  const { api, demo, session, draft, setDraft } = useRentalApi();
  const { busy, error, run, clearError } = useApiAction();
  const requestKey = useRequestKey();
  const [quoted, setQuoted] = useState<{
    quote: Quote;
    fingerprint: string;
  } | null>(null);
  const [submitted, setSubmitted] = useState<RentalOrder | null>(null);
  const [delivery, setDelivery] = useState("pickup");
  const [address, setAddress] = useState("");
  const [clock, setClock] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const result = useRef<HTMLDivElement>(null);
  const items = slugs.map((productSlug) => ({ productSlug, quantity: 1 }));
  const input = {
    items,
    pickupDate: draft.pickupDate,
    returnDate: draft.returnDate,
  };
  const fingerprint = JSON.stringify({
    ...input,
    customerId: session.profile?.id,
  });
  const latestFingerprint = useRef(fingerprint);
  // A response is associated with its exact selection/dates, even if the bag changes.
  const quote = quoted?.fingerprint === fingerprint ? quoted.quote : null;
  const expired = quote ? Date.parse(quote.expiresAt) <= clock : false;
  const setField = (field: keyof typeof draft, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setSubmitted(null);
    clearError();
  };
  return (
    <div className="store-api-form">
      <div className="store-request-selection">
        <h3>{t("Selected looks")}</h3>
        <ul>
          {slugs.map((slug) => {
            const product = products.find((p) => p.slug === slug);
            return product ? (
              <li key={slug}>
                <strong>{product.name}</strong>
                <span>
                  {formatPrice(product.price)} ·
                  {t(demo ? "Sample price" : "Listed rental price")}
                </span>
              </li>
            ) : null;
          })}
        </ul>
      </div>
      <SessionPanel compact />
      {advice && <p className="store-advice-note">{advice}</p>}
      <h2>
        <T>{"Plan your rental"}</T>
      </h2>
      <p>
        <T>
          {
            "Pickup and return at the store. The staff will review your request before confirming."
          }
        </T>
      </p>
      {demo && (
        <p className="store-api-hint">
          <T>
            {
              "Demo: choose 1–3 calendar days. The displayed amount is illustrative, not a confirmed daily rate."
            }
          </T>
        </p>
      )}
      <form
        className="store-api-form"
        onSubmit={(event) => {
          event.preventDefault();
          latestFingerprint.current = fingerprint;
          void run(async () => {
            const dateError = rentalDateError(input);
            if (dateError) throw new Error(dateError);
            const value = await api.call("availability.quote", input);
            if (latestFingerprint.current === fingerprint) {
              setQuoted({ quote: value, fingerprint });
              setSubmitted(null);
            }
          });
        }}
      >
        <RentalDateFields
          dates={draft}
          disabled={busy}
          onChange={(dates) => {
            setDraft((previous) => ({ ...previous, ...dates }));
            setSubmitted(null);
            clearError();
          }}
        />
        <fieldset className="store-receiving">
          <legend>{t("How would you like to receive your outfit?")}</legend>
          <label>
            <input
              type="radio"
              name="delivery"
              value="pickup"
              checked={delivery === "pickup"}
              disabled={busy}
              onChange={() => setDelivery("pickup")}
            />
            {t("Try on and collect at the store")}
          </label>
          <label>
            <input
              type="radio"
              name="delivery"
              value="shipping"
              checked={delivery === "shipping"}
              disabled={busy}
              onChange={() => setDelivery("shipping")}
            />
            {t("Request delivery for store review")}
          </label>
          {delivery === "shipping" && (
            <label>
              {t("Delivery address")}
              <textarea
                rows={2}
                maxLength={200}
                required
                value={address}
                disabled={busy}
                onChange={(e) => setAddress(e.target.value)}
              />
              <small>
                {t(
                  "The store must confirm delivery area, timing and fees. This is a request only.",
                )}
              </small>
            </label>
          )}
        </fieldset>
        <label>
          <T>{"Notes for the store "}</T>
          <span>
            <T>{"(optional)"}</T>
          </span>
          <textarea
            rows={3}
            maxLength={600}
            value={draft.notes}
            disabled={busy}
            onChange={(event) => setField("notes", event.target.value)}
            placeholder={t("Anything you would like us to know?")}
          />
        </label>
        <Button variant="outline" disabled={busy || !slugs.length}>
          <T>{busy ? "Please wait…" : "Check availability"}</T>
        </Button>
      </form>
      {quote && !submitted && (
        <div className="store-api-panel">
          <h3>
            <T>{demo ? "Sample quote" : "Rental quote"}</T>
          </h3>
          <ul>
            {quote.lines.map((line) => (
              <li key={line.productSlug}>
                {line.name} × {line.quantity}{" "}
                <strong>{formatPrice(line.amount)}</strong>
              </li>
            ))}
          </ul>
          <p>
            <T>{"Total: "}</T>
            <strong>{formatPrice(quote.total)}</strong>
          </p>
          <p className="store-api-hint">
            <T>{quote.policyLabel}</T>
          </p>
          <p>
            <T>{"Valid until "}</T>
            {new Date(quote.expiresAt).toLocaleTimeString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}
            <T>
              {
                ". The store reviews the request before confirming availability."
              }
            </T>
          </p>
          {expired && (
            <p role="alert">
              {t("Your quote expired. Check availability again.")}
            </p>
          )}
          {!session.profile && (
            <p>
              <T>
                {
                  "Sign in above to send this request. Your dates and notes stay here."
                }
              </T>
            </p>
          )}
          <Button
            disabled={
              busy ||
              !session.profile?.name ||
              !session.profile?.phone ||
              Boolean(submitted) ||
              expired ||
              (delivery === "shipping" && !address.trim())
            }
            onClick={() =>
              void run(async () => {
                if (Date.parse(quote.expiresAt) <= Date.now())
                  throw new Error(
                    "Your quote expired. Check availability again.",
                  );
                const payload = {
                  quoteId: quote.id,
                  notes: requestNotes(draft.notes, advice, delivery, address),
                };
                const order = await api.call("orders.create", {
                  ...payload,
                  idempotencyKey: requestKey(payload),
                });
                setSubmitted(order);
                requestAnimationFrame(() => result.current?.focus());
              })
            }
          >
            <T>{demo ? "Send demo request" : "Send rental request"}</T>
          </Button>
        </div>
      )}
      {error && (
        <p className="store-api-error" role="alert">
          {error.endsWith(
            " is unavailable for these dates. Please check again.",
          )
            ? t("{name} is unavailable for these dates. Please check again.", {
                name: error.slice(
                  0,
                  -" is unavailable for these dates. Please check again."
                    .length,
                ),
              })
            : t(error)}
        </p>
      )}
      {submitted && (
        <div
          ref={result}
          tabIndex={-1}
          role="status"
          className="store-api-panel"
        >
          <p className="store-api-hint">
            <T>{demo ? "Demo request" : "Request"}</T> {submitted.id}
            <T>{" is pending approval."}</T>
          </p>
          <BookingConfirmation order={submitted} />
        </div>
      )}
    </div>
  );
}
