"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { languageStorageKey, translate, type Language } from "@/lib/language";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
}>({ language: "en", setLanguage: () => {} });
export function LanguageProvider({
  children,
  initialLanguage = "vi",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, updateLanguage] = useState(initialLanguage);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(languageStorageKey);
        if (saved === "vi" || saved === "en") updateLanguage(saved);
      } catch {
        /* Language remains usable without device storage. */
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function setLanguage(value: Language) {
    updateLanguage(value);
    try {
      localStorage.setItem(languageStorageKey, value);
    } catch {
      /* Preserve this visit's choice. */
    }
  }
  return (
    <LanguageContext value={{ language, setLanguage }}>
      {children}
    </LanguageContext>
  );
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  return {
    ...context,
    t: (phrase: string, values?: Record<string, string | number>) =>
      translate(context.language, phrase, values),
  };
}
/** Small client text boundary lets route composition stay server-rendered. */
export function T({ children }: { children: string }) {
  const { t } = useLanguage();
  return t(children);
}
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="home-language"
      role="group"
      aria-label="Ngôn ngữ / Language"
    >
      <button
        type="button"
        lang="vi"
        aria-label="Tiếng Việt"
        aria-pressed={language === "vi"}
        onClick={() => setLanguage("vi")}
      >
        VI
      </button>
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
