"use client";
import { useState } from "react";
import { MessageCircle, Phone, Copy, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { contactHref, storeDetails } from "@/lib/store-details";
import { useLanguage } from "./language-provider";

export function ContactOptions({
  message = "",
  label = "Quick advice",
  className = "",
}: {
  message?: string;
  label?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={`store-contact-trigger ${className}`}
        >
          <MessageCircle aria-hidden="true" />
          {t(label)}
        </Button>
      </SheetTrigger>
      <SheetContent className="store-contact-sheet">
        <SheetHeader>
          <SheetTitle>{t("Let's find your look.")}</SheetTitle>
          <SheetDescription>
            {t(
              "Choose a channel. Your message is only sent when you send it yourself.",
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="store-contact-list">
          {(
            [
              ["zalo", "Zalo", MessageCircle],
              ["facebook", "Fanpage", ArrowUpRight],
              ["phone", "Hotline", Phone],
            ] as const
          ).map(([key, name, Icon]) => {
            const href = contactHref(key, storeDetails[key]);
            return href ? (
              <a
                key={key}
                href={href}
                target={key === "phone" ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                <Icon aria-hidden="true" />
                <span>{name}</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            ) : (
              <div key={key} className="store-contact-unavailable">
                <Icon aria-hidden="true" />
                <span>
                  {name}
                  <small>{t("Contact details are being updated.")}</small>
                </span>
              </div>
            );
          })}
        </div>
        {message && (
          <CopyMessage message={message} label="Copy advice request" />
        )}
        {!storeDetails.zalo &&
          !storeDetails.facebook &&
          !storeDetails.phone && (
            <p className="store-api-hint">
              {t("No contact details have been supplied for this preview.")}
            </p>
          )}
      </SheetContent>
    </Sheet>
  );
}
export function CopyMessage({
  message,
  label = "Copy booking details",
}: {
  message: string;
  label?: string;
}) {
  const { t } = useLanguage();
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState(false);
  return (
    <div className="store-copy-message">
      <Button
        variant="outline"
        onClick={async () => {
          try {
            if (!navigator.clipboard) throw new Error();
            await navigator.clipboard.writeText(message);
            setNotice(
              "Copied. Paste it into your conversation with the store.",
            );
            setManual(false);
          } catch {
            setManual(true);
            setNotice(
              "Copy is unavailable. Select the text below to copy manually.",
            );
          }
        }}
      >
        <Copy aria-hidden="true" />
        {t(label)}
      </Button>
      {notice && <p role="status">{t(notice)}</p>}
      {manual && (
        <label>
          {t("Message to copy")}
          <textarea
            readOnly
            rows={6}
            value={message}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
}
