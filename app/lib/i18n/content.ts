import {
  getProfile,
  getProjects,
  getRoles,
  getSections,
  getSkillGroups,
  getStrengths,
  getTestimonials,
  getTheme,
  getTranslationsForLocale,
} from "@/lib/content";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/config";
import { buildTranslationLookup, localizeFrom } from "@/lib/i18n/localize";

/**
 * Everything the public portfolio needs, with the requested locale's translations
 * merged over the English base — one extra query (`Translation.findMany`) beyond what
 * components/portfolio.tsx already did. Untranslated / partially-translated fields
 * fall back to English field-by-field (see lib/i18n/localize.ts), so an incomplete
 * translation never blanks content.
 */
export async function getLocalizedContent(locale: LocaleCode) {
  const [theme, sections, profile, roles, strengths, projects, skillGroups, testimonials] =
    await Promise.all([
      getTheme(),
      getSections(),
      getProfile(),
      getRoles(),
      getStrengths(),
      getProjects(),
      getSkillGroups(),
      getTestimonials(),
    ]);

  if (locale === DEFAULT_LOCALE) {
    return { theme, sections, profile, roles, strengths, projects, skillGroups, testimonials };
  }

  const lookup = buildTranslationLookup(await getTranslationsForLocale(locale));

  return {
    theme,
    sections: sections.map((section) => localizeFrom(section, "section", section.id, lookup)),
    profile: localizeFrom(profile, "profile", "singleton", lookup),
    roles: roles.map((role) => localizeFrom(role, "role", role.id, lookup)),
    strengths: strengths.map((strength) => localizeFrom(strength, "strength", strength.id, lookup)),
    projects: projects.map((project) => localizeFrom(project, "project", project.id, lookup)),
    skillGroups: skillGroups.map((group) => localizeFrom(group, "skillGroup", group.id, lookup)),
    testimonials: testimonials.map((testimonial) =>
      localizeFrom(testimonial, "testimonial", testimonial.id, lookup),
    ),
  };
}
