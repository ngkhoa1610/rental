import copy from "./translations/vi.json";
/** English source phrases are stable dictionary keys; API enums and product IDs never change. */
export const vietnamese: Record<string, string> = copy;

export function translate(
  phrase: string,
  values: Record<string, string | number> = {},
): string {
  const key = phrase.replace(/\s+/g, " ").trim();
  const translated = vietnamese[key];
  const template =
    translated === undefined
      ? phrase
      : `${phrase.match(/^\s*/)?.[0] ?? ""}${translated}${phrase.match(/\s*$/)?.[0] ?? ""}`;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    String(values[name] ?? match),
  );
}
