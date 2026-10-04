"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { useRentalApi } from "./api-provider";
import { useLanguage } from "./language-provider";
import { AvailabilityCalendar } from "./availability-calendar";
import { RentalDateFields } from "./rental-date-fields";
import { BookingDrawer } from "./booking-drawer";
import { ContactOptions } from "./contact-options";

export function ProductBooking({ product }: { product: Product }) {
  const { t } = useLanguage();
  const { draft, setDraft } = useRentalApi();
  const [size, setSize] = useState("");
  const advice = size
    ? `${product.name} · Size thường mặc (cần shop tư vấn): ${size}`
    : "";
  return (
    <div className="store-product-booking">
      <fieldset className="store-size-advice">
        <legend>{t("Your usual size")}</legend>
        <div>
          {["S", "M", "L", "Need advice"].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={size === value}
              onClick={() => setSize(value)}
            >
              {t(value)}
            </button>
          ))}
        </div>
        <p>
          {t(
            "For fit advice only. The store confirms garment measurements; stock is managed per product.",
          )}
        </p>
        <Link className="store-text-link" href="/rental-guide">
          {t("Size & rental guide")}
        </Link>
      </fieldset>
      <AvailabilityCalendar
        slug={product.slug}
        dates={draft}
        onChange={(dates) =>
          setDraft((previous) => ({ ...previous, ...dates }))
        }
      />
      <RentalDateFields
        dates={draft}
        onChange={(dates) =>
          setDraft((previous) => ({ ...previous, ...dates }))
        }
      />
      <BookingDrawer slugs={[product.slug]} advice={advice} />
      <ContactOptions
        label="Ask about sizing on Zalo"
        message={`Nhờ shop tư vấn ${product.name}. ${advice} ${draft.pickupDate} – ${draft.returnDate}`}
      />
    </div>
  );
}
