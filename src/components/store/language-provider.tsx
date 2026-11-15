"use client";

import { createContext, useContext } from "react";
import { translate } from "@/lib/language";

const LanguageContext = createContext("vi" as const);
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LanguageContext value="vi">{children}</LanguageContext>;
}
export function useLanguage() {
  const language = useContext(LanguageContext);
  return {
    language,
    t: (phrase: string, values?: Record<string, string | number>) =>
      translate(phrase, values),
  };
}
/** Small client text boundary lets route composition stay server-rendered. */
export function T({ children }: { children: string }) {
  const { t } = useLanguage();
  return t(children);
}
