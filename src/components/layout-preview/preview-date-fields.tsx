"use client";

import { useState } from "react";
import { RentalDateFields } from "@/components/store/rental-date-fields";
import type { RentalDates } from "@/lib/api/contracts";

export function PreviewDateFields() {
  const [dates, setDates] = useState<RentalDates>({
    pickupDate: "",
    returnDate: "",
  });
  return <RentalDateFields dates={dates} onChange={setDates} />;
}
