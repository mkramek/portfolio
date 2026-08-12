// The catalogue of locales this app ships a UI dictionary for. This is an in-code
// constant, not a DB read — `proxy.ts` and `generateStaticParams` both need it before
// touching Prisma is possible (proxy can't reach the DB at all; generateStaticParams
// must stay DB-free so `bun run build` works with no Postgres reachable). Whether a
// catalogue locale is actually turned on for visitors is a separate, DB-backed
// question — see `Locale` in lib/content.ts / getLocales().
export type LocaleCode = "en" | "pl";

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_CATALOGUE: Array<{
  code: LocaleCode;
  englishName: string;
  nativeName: string;
}> = [
  { code: "en", englishName: "English", nativeName: "English" },
  { code: "pl", englishName: "Polish", nativeName: "polski" },
];

export const LOCALE_CODES: LocaleCode[] = LOCALE_CATALOGUE.map((entry) => entry.code);

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALE_CODES as string[]).includes(value);
}

export function catalogueEntry(code: LocaleCode) {
  const entry = LOCALE_CATALOGUE.find((item) => item.code === code);
  if (!entry) throw new Error(`Unknown locale "${code}" — not in LOCALE_CATALOGUE`);
  return entry;
}
