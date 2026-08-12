import {
  getCvSettings,
  getEducation,
  getLanguages,
  getProfile,
  getProjects,
  getRoles,
  getSections,
  getSkillGroups,
  getStrengths,
  getTestimonials,
  getTranslationsForLocale,
} from "@/lib/content";
import { SINGLETON_ID } from "@/lib/defaults";
import { type CompletenessRow, rowCompleteness, summarize } from "@/lib/i18n/completeness";
import { buildTranslationLookup, translationKey } from "@/lib/i18n/localize";
import type { TranslatableEntity } from "@/lib/schemas/translation";

/**
 * Every translatable row in the database, as (entity, entityId, base value) tuples —
 * the full inventory the Translations tab and the Locales tab's completeness badge
 * are both built from. Centralized here so both stay in sync with whatever content
 * actually exists, not a stale hardcoded list.
 */
export async function getTranslatableInventory(): Promise<
  Array<{ entity: TranslatableEntity; entityId: string; base: Record<string, unknown> }>
> {
  const [
    profile,
    education,
    cvSettings,
    roles,
    projects,
    skillGroups,
    strengths,
    testimonials,
    languages,
    sections,
  ] = await Promise.all([
    getProfile(),
    getEducation(),
    getCvSettings(),
    getRoles(),
    getProjects(),
    getSkillGroups(),
    getStrengths(),
    getTestimonials(),
    getLanguages(),
    getSections(),
  ]);

  return [
    { entity: "profile", entityId: SINGLETON_ID, base: profile as Record<string, unknown> },
    { entity: "education", entityId: SINGLETON_ID, base: education as Record<string, unknown> },
    { entity: "cvSettings", entityId: SINGLETON_ID, base: cvSettings as Record<string, unknown> },
    ...roles.map((row) => ({
      entity: "role" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
    ...projects.map((row) => ({
      entity: "project" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
    ...skillGroups.map((row) => ({
      entity: "skillGroup" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
    ...strengths.map((row) => ({
      entity: "strength" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
    ...testimonials.map((row) => ({
      entity: "testimonial" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
    ...languages.map((row) => ({
      entity: "language" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
    ...sections.map((row) => ({
      entity: "section" as const,
      entityId: row.id,
      base: row as Record<string, unknown>,
    })),
  ];
}

export async function getLocaleCompletenessRows(locale: string): Promise<CompletenessRow[]> {
  const [inventory, translations] = await Promise.all([
    getTranslatableInventory(),
    getTranslationsForLocale(locale),
  ]);
  const lookup = buildTranslationLookup(translations);
  return inventory.map((item) =>
    rowCompleteness(
      item.entity,
      item.entityId,
      item.base,
      lookup.get(translationKey(item.entity, item.entityId)),
    ),
  );
}

export async function getLocaleCompleteness(locale: string) {
  return summarize(await getLocaleCompletenessRows(locale));
}
