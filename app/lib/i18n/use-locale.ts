"use client";

import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from "@/lib/i18n/config";

/**
 * Client components can't import `next/root-params` (server-only), so they recover
 * the current locale from the URL's first path segment instead. Used anywhere a
 * client component needs to build a locale-prefixed href or `router.push` target —
 * admin-nav, sign-out, the login form, the CV builder/history download links, etc.
 */
export function useLocale(): LocaleCode {
  const pathname = usePathname();
  const first = pathname?.split("/")[1] ?? "";
  return isLocaleCode(first) ? first : DEFAULT_LOCALE;
}
