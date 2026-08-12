import type { MetadataRoute } from "next";
import { getEnabledLocales, getSetupComplete } from "@/lib/content";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site";

// Lives at the app root (not under [lang]) — it's a single document covering every
// locale, not a per-locale route. Returns an empty sitemap while the publish gate is
// closed (see docs/arch/04-setup-publish-gate.md): there is nothing indexable yet, and
// the "coming soon" placeholder itself is intentionally content-free.
//
// `force-dynamic` (rather than static/ISR) is deliberate: without it, Next tries to
// prerender this route once at build time, which would make `bun run build` depend on
// a reachable database — breaking the Docker/CI build (no Postgres there). Crawler
// traffic is low-volume, so rendering this per-request costs nothing that matters; the
// caching payoff this app cares about is on app/[lang]/page.tsx, the route real
// visitors actually hit repeatedly.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isComplete = await getSetupComplete();
  if (!isComplete) return [];

  const origin = getSiteUrl();
  const enabled = await getEnabledLocales();
  const languages = Object.fromEntries(enabled.map((locale) => [locale, `${origin}/${locale}`]));

  return enabled.map((locale) => ({
    url: `${origin}/${locale}`,
    changeFrequency: "weekly",
    priority: locale === DEFAULT_LOCALE ? 1 : 0.8,
    alternates: { languages: { ...languages, "x-default": `${origin}/${DEFAULT_LOCALE}` } },
  }));
}
