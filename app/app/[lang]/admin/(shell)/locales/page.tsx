import { LocalesView } from "@/components/admin/locales-view";
import { TabHeader } from "@/components/admin/tab-header";
import { getLocales } from "@/lib/content";
import { DEFAULT_LOCALE, LOCALE_CATALOGUE } from "@/lib/i18n/config";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";
import { getLocaleCompleteness } from "@/lib/i18n/report";

export const metadata = { title: "Locales — CV admin" };

export const dynamic = "force-dynamic";

export default async function LocalesPage() {
  const [locales, dict] = await Promise.all([getLocales(), getAdminDictionary()]);

  const rows = await Promise.all(
    locales.map(async (locale) => {
      const entry = LOCALE_CATALOGUE.find((c) => c.code === locale.code);
      const percent =
        locale.code === DEFAULT_LOCALE ? 100 : (await getLocaleCompleteness(locale.code)).percent;
      return {
        code: locale.code,
        enabled: locale.enabled,
        englishName: entry?.englishName ?? locale.code,
        nativeName: entry?.nativeName ?? locale.code,
        percent,
      };
    }),
  );

  return (
    <div>
      <TabHeader title={dict.pages.locales.title} help={dict.pages.locales.help} />
      <LocalesView rows={rows} dict={dict.locales} />
    </div>
  );
}
