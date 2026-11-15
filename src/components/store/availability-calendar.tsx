"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthDates, rangeDates, shiftMonth } from "@/lib/rental-calendar";
import { rentalToday } from "@/lib/rental-dates";
import type { AvailabilityMonth, RentalDates } from "@/lib/api/contracts";
import { useRentalApi } from "./api-provider";
import { useLanguage } from "./language-provider";

export function AvailabilityCalendar({
  slug,
  dates,
  onChange,
}: {
  slug: string;
  dates: RentalDates;
  onChange: (value: RentalDates) => void;
}) {
  const { api, demo } = useRentalApi();
  const { t } = useLanguage();
  const id = useId();
  const initialMonth = useRef(dates.pickupDate.slice(0, 7));
  const [month, setMonth] = useState("");
  const [revision, setRevision] = useState(0);
  const [snapshots, setSnapshots] = useState<Record<string, AvailabilityMonth>>(
    {},
  );
  const [loaded, setLoaded] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [choosingReturn, setChoosingReturn] = useState(false);
  const key = `${slug}:${month}:${revision}`;
  const data = loaded === key ? snapshots[`${slug}:${month}`] : undefined;
  useEffect(() => {
    queueMicrotask(() =>
      setMonth(initialMonth.current || rentalToday().slice(0, 7)),
    );
  }, []); // Initial month only; later date input changes do not reset month navigation.
  useEffect(() => {
    if (!month) return;
    const controller = new AbortController();
    let active = true;
    api
      .call(
        "availability.calendar",
        { productSlug: slug, month },
        { signal: controller.signal },
      )
      .then((value) => {
        if (!active) return;
        if (value.productSlug !== slug || value.month !== month)
          throw new Error(
            "The calendar response does not match your selection.",
          );
        setSnapshots((previous) => ({
          ...previous,
          [`${slug}:${month}`]: value,
        }));
        setLoaded(key);
        setError("");
      })
      .catch((failure) => {
        if (active) {
          setError(
            failure instanceof Error ? failure.message : "Please retry.",
          );
          setLoaded(key);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [api, slug, month, key]);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const days = monthDates(month);
  const leading = days.length
    ? (new Date(`${days[0]}T00:00:00Z`).getUTCDay() + 6) % 7
    : 0;
  const availableByDay = new Map(
    data?.days.map((day) => [day.date, day.available]),
  );
  const today = rentalToday();
  function select(date: string) {
    if (!choosingReturn || date < dates.pickupDate) {
      onChange({ pickupDate: date, returnDate: date });
      setChoosingReturn(true);
      setNotice(
        "Now choose a return date. Select the same day for a same-day rental.",
      );
      return;
    }
    const selected = rangeDates(dates.pickupDate, date);
    const known = new Map(
      Object.values(snapshots)
        .filter((s) => s.productSlug === slug)
        .flatMap((s) =>
          s.days.map((day) => [day.date, day.available] as const),
        ),
    );
    if (
      !selected.length ||
      selected.some((day) => !known.has(day) || known.get(day) === 0)
    ) {
      setNotice(
        "This range includes an unavailable or unchecked day. Choose another range.",
      );
      return;
    }
    onChange({ pickupDate: dates.pickupDate, returnDate: date });
    setChoosingReturn(false);
    setNotice(
      "Dates selected. Check the full range before sending your request.",
    );
  }
  return (
    <section className="store-calendar" aria-labelledby={`${id}-heading`}>
      <div className="store-calendar-heading">
        <h3 id={`${id}-heading`}>{t("Availability calendar")}</h3>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t("Refresh availability")}
          onClick={() => {
            setError("");
            setRevision((v) => v + 1);
          }}
        >
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>
      <div className="store-calendar-month">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t("Previous month")}
          disabled={!month || month <= today.slice(0, 7)}
          onClick={() => {
            setError("");
            setMonth(shiftMonth(month, -1));
          }}
        >
          <ChevronLeft />
        </Button>
        <strong aria-live="polite">
          {month
            ? new Date(`${month}-01T00:00:00Z`).toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })
            : t("Loading calendar…")}
        </strong>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t("Next month")}
          disabled={!month || month >= "2100-12"}
          onClick={() => {
            setError("");
            setMonth(shiftMonth(month, 1));
          }}
        >
          <ChevronRight />
        </Button>
      </div>
      <div
        className="store-calendar-grid"
        aria-label={t("Choose pickup and return dates")}
      >
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span className="store-calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((date) => {
          const available = availableByDay.get(date);
          const disabled =
            !data || Boolean(error) || date < today || available === 0;
          const selected = date >= dates.pickupDate && date <= dates.returnDate;
          const status =
            date < today
              ? "Past date"
              : !data || error
                ? "Not checked"
                : available === 0
                  ? "Unavailable"
                  : "Available";
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-label={`${date} · ${t(status)}`}
              aria-pressed={selected}
              data-state={
                disabled ? "disabled" : selected ? "selected" : "available"
              }
              onClick={() => select(date)}
              onKeyDown={(event) => {
                const offset: Record<string, number> = {
                  ArrowLeft: -1,
                  ArrowRight: 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                };
                if (!(event.key in offset)) return;
                event.preventDefault();
                const buttons = Array.from(
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    "button",
                  ) ?? [],
                );
                const index =
                  buttons.indexOf(event.currentTarget) + offset[event.key];
                buttons[index]?.focus();
              }}
            >
              {Number(date.slice(-2))}
              <span className="store-calendar-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="store-api-error">
          {t(error)}{" "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setRevision((v) => v + 1);
            }}
          >
            {t("Retry")}
          </button>
        </p>
      ) : !data ? (
        <p role="status">{t("Loading calendar…")}</p>
      ) : (
        <p className="store-calendar-legend">
          <span>{t("Available")}</span>
          <span>{t("Unavailable")}</span>
          <small>
            {t(demo ? "Sample calendar · checked at" : "Checked at")}{" "}
            {new Date(data.checkedAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </p>
      )}
      {notice && (
        <p role="status" className="store-api-hint">
          {t(notice)}
        </p>
      )}
    </section>
  );
}
