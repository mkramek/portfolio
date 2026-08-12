import type { LocaleCode } from "@/lib/i18n/config";
import type { Profile } from "@/lib/schemas/profile";
import { getSiteUrl } from "@/lib/site";

/**
 * A `Person` JSON-LD graph built straight from data getProfile()/getLocalizedContent()
 * already return — no extra query. Only emitted once the publish gate is open (see
 * components/portfolio.tsx), matching the "no personalization before publish" rule the
 * coming-soon page already follows.
 */
export function personJsonLd(profile: Profile, locale: LocaleCode) {
  const origin = getSiteUrl();
  const sameAs = [profile.linkedin, profile.github].filter((value): value is string =>
    Boolean(value),
  );
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title || undefined,
    description: profile.tagline || profile.summary || undefined,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    url: `${origin}/${locale}`,
    inLanguage: locale,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(profile.location
      ? { address: { "@type": "PostalAddress", addressLocality: profile.location } }
      : {}),
  };
}
