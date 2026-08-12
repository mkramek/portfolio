import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { Portfolio } from "@/components/portfolio";
import { getEnabledLocales, getSetupComplete } from "@/lib/content";
import { DEFAULT_LOCALE, isLocaleCode } from "@/lib/i18n/config";
import { ComingSoon } from "./coming-soon";

// No `dynamic = "force-dynamic"` here on purpose — this is the route the ISR window on
// app/[lang]/layout.tsx's `revalidate` exists for. See lib/revalidate.ts for how admin
// writes still show up immediately despite the cache.
export default async function Home() {
  const rawLocale = await lang();
  if (!isLocaleCode(rawLocale)) notFound();
  const locale = rawLocale;

  if (locale !== DEFAULT_LOCALE) {
    const enabled = await getEnabledLocales();
    if (!enabled.includes(locale)) notFound();
  }

  const isComplete = await getSetupComplete();

  if (!isComplete) return <ComingSoon />;

  return <Portfolio locale={locale} />;
}
