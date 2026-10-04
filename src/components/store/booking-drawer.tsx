"use client";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "./language-provider";
import { RentalRequest } from "./rental-request";
export function BookingDrawer({
  slugs,
  advice = "",
  label = "Reserve these dates",
}: {
  slugs: readonly string[];
  advice?: string;
  label?: string;
}) {
  const { t } = useLanguage();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="home-cta store-booking-trigger">
          <CalendarCheck aria-hidden="true" />
          {t(label)}
        </Button>
      </SheetTrigger>
      <SheetContent className="store-booking-drawer">
        <SheetHeader>
          <SheetTitle>{t("Confirm your booking request")}</SheetTitle>
          <SheetDescription>
            {t(
              "No online payment. The store will review your dates before confirming.",
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="store-booking-content">
          <RentalRequest slugs={slugs} advice={advice} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
