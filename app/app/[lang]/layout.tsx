import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import type { ReactNode } from "react";
import { getEnabledLocales, getSetupComplete, getTheme } from "@/lib/content";
import { DEFAULT_LOCALE, isLocaleCode } from "@/lib/i18n/config";
import { getLocalizedContent } from "@/lib/i18n/content";
import { getPublicDictionary } from "@/lib/i18n/dictionaries";
import { getSiteUrl } from "@/lib/site";
import "../globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// The public portfolio is the only route that actually uses this — every route under
// app/[lang]/admin/** declares its own `dynamic = "force-dynamic"`, which forces the
// *entire* request (including this shared root layout) to render dynamically for that
// route regardless of what's set here. So this `revalidate` window only ever governs
// the cached, ISR-served public path; admin always renders live. Edits go out
// immediately via revalidatePath() in lib/revalidate.ts, called from every mutating
// admin route — see docs/arch/11-i18n.md.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await lang();
  if (!isLocaleCode(locale)) return {};

  const origin = getSiteUrl();
  const [isComplete, enabledLocales] = await Promise.all([getSetupComplete(), getEnabledLocales()]);
  const languages: Record<string, string> = Object.fromEntries(
    enabledLocales.map((code) => [code, `${origin}/${code}`]),
  );
  languages["x-default"] = `${origin}/${DEFAULT_LOCALE}`;
  const alternates = { canonical: `${origin}/${locale}`, languages };

  if (!isComplete) {
    // Fully static placeholder — fixed copy only, no personalization (see
    // docs/arch/04-setup-publish-gate.md). Its metadata must be equally content-free:
    // no Profile.name, and marked noindex since there's nothing to rank yet.
    const dict = await getPublicDictionary();
    return {
      metadataBase: new URL(origin),
      title: dict.comingSoon.title,
      description: dict.comingSoon.body,
      alternates,
      robots: { index: false, follow: false },
    };
  }

  const { profile } = await getLocalizedContent(locale);
  const description = profile.tagline || profile.summary || undefined;

  return {
    metadataBase: new URL(origin),
    title: profile.name || "Portfolio",
    description,
    alternates,
    openGraph: {
      type: "profile",
      title: profile.name,
      description,
      locale,
      alternateLocale: enabledLocales.filter((code) => code !== locale),
      url: `${origin}/${locale}`,
    },
    twitter: { card: "summary", title: profile.name, description },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await lang();
  // Guards against a garbage `[lang]` segment (e.g. /xx/whatever) reaching any route.
  // Whether an in-catalogue locale is actually *enabled* for public visitors is a
  // separate check made by app/[lang]/page.tsx — admin routes intentionally skip it
  // (see docs/arch/11-i18n.md) so disabling the locale you're editing in never locks
  // you out of the panel.
  if (!isLocaleCode(locale)) notFound();

  const theme = await getTheme();

  return (
    <html
      lang={locale}
      data-theme={theme.mode}
      data-accent={theme.accent}
      className={`${jetbrainsMono.variable} ${ibmPlexSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
