"use client";
import Link from "next/link";
import { Check, Clock3 } from "lucide-react";
import { bookingMessage } from "@/lib/store-details";
import type { RentalOrder } from "@/lib/api/contracts";
import { useLanguage } from "./language-provider";
import { ContactOptions, CopyMessage } from "./contact-options";

export function BookingConfirmation({ order }: { order: RentalOrder }) {
  const { t } = useLanguage();
  return (
    <div className="store-booking-success">
      <span className="store-success-icon">
        <Check aria-hidden="true" />
      </span>
      <h3>{t("We've received your request.")}</h3>
      <p>
        {t("Booking ID")}{" "}
        <strong className="store-booking-id">{order.id}</strong>
      </p>
      <span className="store-status-pill">
        <Clock3 aria-hidden="true" />
        {t("Awaiting store approval")}
      </span>
      <p>
        {t(
          "Your request is recorded. The store will review it before confirming your rental.",
        )}
      </p>
      <dl className="store-confirm-summary">
        <div>
          <dt>{t("Pickup date")}</dt>
          <dd>{order.pickupDate}</dd>
        </div>
        <div>
          <dt>{t("Return date")}</dt>
          <dd>{order.returnDate}</dd>
        </div>
      </dl>
      <CopyMessage message={bookingMessage(order)} />
      <ContactOptions
        message={bookingMessage(order)}
        label="Send booking details to the store"
      />
      <Link href="/account/orders" className="store-text-link">
        {t("View your requests")}
      </Link>
    </div>
  );
}
