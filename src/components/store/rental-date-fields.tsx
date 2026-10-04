"use client";

import { useId, useSyncExternalStore } from "react";
import { rentalToday } from "@/lib/rental-dates";
import type { RentalDates } from "@/lib/api/contracts";
import { useLanguage } from "@/components/store/language-provider";

function subscribe(callback: () => void) {
  const timer = window.setInterval(callback, 60000);
  window.addEventListener("focus", callback);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", callback);
  };
}
export function RentalDateFields({
  dates,
  onChange,
  disabled = false,
  change = false,
}: {
  dates: RentalDates;
  onChange: (dates: RentalDates) => void;
  disabled?: boolean;
  change?: boolean;
}) {
  const { t, language } = useLanguage();
  const today = useSyncExternalStore(subscribe, rentalToday, () => "");
  const hintId = useId();
  return (
    <div className="store-date-picker">
      <div className="store-api-fields">
        <label>
          {t(change ? "New pickup date" : "Pickup date")}
          <input
            name="pickupDate"
            type="date"
            lang={language === "vi" ? "vi-VN" : "en-GB"}
            min={today || undefined}
            value={dates.pickupDate}
            required
            disabled={disabled || !today}
            aria-describedby={hintId}
            onChange={(event) => {
              const pickupDate = event.target.value;
              onChange({
                pickupDate,
                returnDate:
                  !dates.returnDate || dates.returnDate < pickupDate
                    ? pickupDate
                    : dates.returnDate,
              });
            }}
          />
        </label>
        <label>
          {t(change ? "New return date" : "Return date")}
          <input
            name="returnDate"
            type="date"
            lang={language === "vi" ? "vi-VN" : "en-GB"}
            min={
              dates.pickupDate > today ? dates.pickupDate : today || undefined
            }
            value={dates.returnDate}
            required
            disabled={disabled || !today}
            aria-describedby={hintId}
            onChange={(event) =>
              onChange({ ...dates, returnDate: event.target.value })
            }
          />
        </label>
      </div>
      <p className="store-api-hint" id={hintId}>
        {t(
          "Same-day and next-day returns are welcome. Pickup cannot be in the past.",
        )}
      </p>
    </div>
  );
}
