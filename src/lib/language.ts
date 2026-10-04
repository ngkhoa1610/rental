import copy from "./translations/vi.json";
export type Language = "vi" | "en";
export const languageStorageKey = "rental-store.language.v1";

/** English source phrases are stable dictionary keys; API enums and product IDs never change. */
export const vietnamese: Record<string, string> = copy;

export function translate(
  language: Language,
  phrase: string,
  values: Record<string, string | number> = {},
): string {
  const key = phrase.replace(/\s+/g, " ").trim();
  const translated = language === "vi" ? vietnamese[key] : undefined;
  const template =
    translated === undefined
      ? phrase
      : `${phrase.match(/^\s*/)?.[0] ?? ""}${translated}${phrase.match(/\s*$/)?.[0] ?? ""}`;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    String(values[name] ?? match),
  );
}
