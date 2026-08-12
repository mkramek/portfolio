import { TabHeader } from "@/components/admin/tab-header";
import { TranslationsView } from "@/components/admin/translations-view";
import { getEnabledLocales, getTranslationsForLocale } from "@/lib/content";
import { rowCompleteness } from "@/lib/i18n/completeness";
import { DEFAULT_LOCALE, LOCALE_CATALOGUE, type LocaleCode } from "@/lib/i18n/config";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";
import { buildTranslationLookup, translationKey } from "@/lib/i18n/localize";
import { getTranslatableInventory } from "@/lib/i18n/report";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatable";

export const metadata = { title: "Translations — CV admin" };

export const dynamic = "force-dynamic";

function entityLabelOf(entity: string, base: Record<string, unknown>): string {
  const candidates = ["company", "name", "group", "author", "title", "id", "degree", "label"];
  for (const key of candidates) {
    const value = base[key];
    if (typeof value === "string" && value) return value;
  }
  return entity;
}

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; missing?: string }>;
}) {
  const { locale: localeParam, missing } = await searchParams;
  const [enabledLocales, dict] = await Promise.all([getEnabledLocales(), getAdminDictionary()]);
  const targetLocales = enabledLocales.filter((code) => code !== DEFAULT_LOCALE);
  const target: LocaleCode | undefined =
    (localeParam && targetLocales.includes(localeParam as LocaleCode)
      ? (localeParam as LocaleCode)
      : targetLocales[0]) ?? undefined;
  const missingOnly = missing !== "0";

  if (!target) {
    return (
      <div>
        <TabHeader title={dict.pages.translations.title} help={dict.pages.translations.help} />
        <p className="mt-6 max-w-[520px] text-[12.5px] leading-[1.6] text-dim">
          {dict.pages.translations.help}
        </p>
      </div>
    );
  }

  const [inventory, translations] = await Promise.all([
    getTranslatableInventory(),
    getTranslationsForLocale(target),
  ]);
  const lookup = buildTranslationLookup(translations);

  const rows = inventory
    .map((item) => {
      const completeness = rowCompleteness(
        item.entity,
        item.entityId,
        item.base,
        lookup.get(translationKey(item.entity, item.entityId)),
      );
      return {
        entity: item.entity,
        entityId: item.entityId,
        entityLabel: entityLabelOf(item.entity, item.base),
        fields: TRANSLATABLE_FIELDS[item.entity],
        base: item.base,
        current: (lookup.get(translationKey(item.entity, item.entityId)) ?? {}) as Record<
          string,
          unknown
        >,
        completeness,
      };
    })
    .filter((row) => row.completeness.needed > 0)
    .filter((row) => !missingOnly || row.completeness.filled < row.completeness.needed);

  return (
    <div>
      <TabHeader title={dict.pages.translations.title} help={dict.pages.translations.help} />
      <TranslationsView
        targetLocale={target}
        targetLocales={targetLocales.map((code) => ({
          code,
          nativeName: LOCALE_CATALOGUE.find((c) => c.code === code)?.nativeName ?? code,
        }))}
        missingOnly={missingOnly}
        rows={rows}
        dict={dict}
      />
    </div>
  );
}
