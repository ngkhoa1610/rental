"use client";
import Link from "next/link";
import { Check, Clock3, Landmark } from "lucide-react";
import { FashionImage } from "@/components/ui/fashion-image";
import { formatPrice } from "@/lib/catalog";
import { bookingMessage, storeDetails } from "@/lib/store-details";
import type { RentalOrder } from "@/lib/api/contracts";
import { useLanguage } from "./language-provider";
import { ContactOptions, CopyMessage } from "./contact-options";

export function BookingConfirmation({ order }: { order: RentalOrder }) {
  const { t } = useLanguage();
  const bank = storeDetails.bank;
  const configured =
    bank &&
    bank.name &&
    bank.accountName &&
    bank.accountNumber &&
    /^\/images\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp)$/.test(bank.qrImage);
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
          "Your booking ID is a request reference, not a confirmed reservation or payment.",
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
        <div>
          <dt>{t("Rental total")}</dt>
          <dd>{formatPrice(order.payment.due)}</dd>
        </div>
        <div>
          <dt>{t("Deposit")}</dt>
          <dd>{t("The store will confirm")}</dd>
        </div>
      </dl>
      <section className="store-deposit">
        <h4>
          <Landmark aria-hidden="true" />
          {t("Next: confirm with the store")}
        </h4>
        <p>
          {t(
            "Wait for the store to confirm your dates and deposit before transferring money.",
          )}
        </p>
        {configured ? (
          <div>
            <FashionImage
              src={bank.qrImage}
              alt={t("Store bank transfer QR")}
              width={200}
              height={200}
            />
            <p>
              {bank.name} · {bank.accountName}
            </p>
            <p>{bank.accountNumber}</p>
            <p>
              {t("Transfer reference")}: {order.id} {order.contact.phone}
            </p>
            <p>{t("Payment is recorded by staff after verification.")}</p>
          </div>
        ) : (
          <p>
            {t(
              "The store will provide its deposit amount and verified transfer instructions after approval.",
            )}
          </p>
        )}
      </section>
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
