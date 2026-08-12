import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocaleCode, type LocaleCode } from "./config";
import type { AdminDictionary } from "./dictionaries/en/admin";
import type { CvDictionary } from "./dictionaries/en/cv";
import type { PublicDictionary } from "./dictionaries/en/public";
import { loadDictionary } from "./dictionary-loader";

async function resolveLocale(): Promise<LocaleCode> {
  const locale = await lang();
  if (!isLocaleCode(locale)) notFound();
  return locale;
}

/** The public portfolio / coming-soon page's UI chrome, for the current root `[lang]`. */
export async function getPublicDictionary(): Promise<PublicDictionary> {
  return loadDictionary(await resolveLocale(), "public");
}

/** The admin panel's UI chrome, for the current root `[lang]`. */
export async function getAdminDictionary(): Promise<AdminDictionary> {
  return loadDictionary(await resolveLocale(), "admin");
}

/**
 * The generated CV document's own text. Takes an explicit locale rather than reading
 * the root `[lang]` param — a CV's content locale (CvSettings.locale / snapshot.locale)
 * is independent of whichever locale the admin happens to be browsing in.
 */
export async function getCvDictionary(locale: LocaleCode): Promise<CvDictionary> {
  return loadDictionary(locale, "cv");
}
