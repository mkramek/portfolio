import type { LocaleCode } from "@/lib/i18n/config";

/**
 * Plain `<a>` tags — no client component, no JS, no cookie. Renders only enabled
 * locales; nothing at all when there's just one (the common case out of the box).
 */
export function LanguageSwitcher({
  current,
  locales,
}: {
  current: LocaleCode;
  locales: Array<{ code: LocaleCode; nativeName: string }>;
}) {
  if (locales.length < 2) return null;

  return (
    <nav aria-label="Language" className="flex flex-wrap gap-[10px] font-mono text-[11px]">
      {locales.map((locale) => (
        <a
          key={locale.code}
          href={`/${locale.code}`}
          hrefLang={locale.code}
          aria-current={locale.code === current ? "true" : undefined}
          className={
            locale.code === current
              ? "text-ac"
              : "text-dim underline-offset-4 hover:text-fg hover:underline"
          }
        >
          {locale.nativeName}
        </a>
      ))}
    </nav>
  );
}
