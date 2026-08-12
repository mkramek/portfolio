import { prisma } from "./db";
import { APP_DEFAULTS, DEFAULT_SECTIONS, SINGLETON_ID } from "./defaults";
import { DEFAULT_LOCALE, LOCALE_CATALOGUE, type LocaleCode } from "./i18n/config";
import type { CvSettings } from "./schemas/cv-settings";
import type { Education } from "./schemas/education";
import type { Language } from "./schemas/language";
import type { LocaleSetting } from "./schemas/locale";
import type { Profile } from "./schemas/profile";
import type { Project } from "./schemas/project";
import type { Role } from "./schemas/role";
import type { Section } from "./schemas/section";
import { requiredForSetupSchema } from "./schemas/setup";
import type { SkillGroup } from "./schemas/skill-group";
import type { Strength } from "./schemas/strength";
import type { Testimonial } from "./schemas/testimonial";
import type { Theme } from "./schemas/theme";
import type { TranslatableEntity, Translation } from "./schemas/translation";

const EMPTY_PROFILE: Profile = { name: "", handle: "", title: "", summary: "", email: "" };
const EMPTY_EDUCATION: Education = { degree: "", detail: "" };

export type RoleRow = Role & { id: string };
export type StrengthRow = Strength & { id: string };
export type ProjectRow = Project & { id: string };
export type SkillGroupRow = SkillGroup & { id: string };
export type TestimonialRow = Testimonial & { id: string };
export type LanguageRow = Language & { id: string };

export async function getTheme(): Promise<Theme> {
  const row = await prisma.theme.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return APP_DEFAULTS.theme;
  const { id: _id, ...theme } = row;
  return theme;
}

export async function setTheme(input: Theme): Promise<void> {
  await prisma.theme.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...input },
    update: input,
  });
}

export async function getCvSettings(): Promise<CvSettings> {
  const row = await prisma.cvSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return APP_DEFAULTS.cv;
  const { id: _id, ...cv } = row;
  return { ...cv, locale: cv.locale as CvSettings["locale"] };
}

export async function setCvSettings(input: CvSettings): Promise<void> {
  await prisma.cvSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...input },
    update: input,
  });
}

export async function getSections(): Promise<Section[]> {
  const rows = await prisma.section.findMany();
  const merged = new Map<string, Section>();
  for (const section of DEFAULT_SECTIONS) merged.set(section.id, section);
  for (const row of rows) merged.set(row.id, row);
  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function setSection(input: Section): Promise<void> {
  await prisma.section.upsert({
    where: { id: input.id },
    create: input,
    update: input,
  });
}

export async function getProfile(): Promise<Profile> {
  const row = await prisma.profile.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return EMPTY_PROFILE;
  const { id: _id, heroStats, ledgerRows, ...rest } = row;
  return {
    ...rest,
    tagline: rest.tagline ?? undefined,
    phone: rest.phone ?? undefined,
    location: rest.location ?? undefined,
    linkedin: rest.linkedin ?? undefined,
    github: rest.github ?? undefined,
    availability: rest.availability ?? undefined,
    heroStats: heroStats as Profile["heroStats"],
    ledgerRows: ledgerRows as Profile["ledgerRows"],
  };
}

export async function setProfile(input: Profile): Promise<boolean> {
  await prisma.profile.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...input },
    update: input,
  });
  return recomputeSetupState();
}

export async function getRoles(): Promise<RoleRow[]> {
  const rows = await prisma.role.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(({ id, ...role }) => ({
    id,
    ...role,
    bullets: role.bullets as Role["bullets"],
    metrics: role.metrics as Role["metrics"],
    stack: role.stack as Role["stack"],
    caseStudy: role.caseStudy as Role["caseStudy"],
  }));
}

export async function createRole(input: Role): Promise<boolean> {
  await prisma.role.create({ data: input });
  return recomputeSetupState();
}

export async function getSkillGroups(): Promise<SkillGroupRow[]> {
  const rows = await prisma.skillGroup.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(({ id, ...group }) => ({
    id,
    ...group,
    items: group.items as SkillGroup["items"],
  }));
}

export async function getStrengths(): Promise<StrengthRow[]> {
  const rows = await prisma.strength.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(({ id, ...strength }) => ({ id, ...strength }));
}

export async function getProjects(): Promise<ProjectRow[]> {
  const rows = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(({ id, ...project }) => ({
    id,
    ...project,
    stack: project.stack as Project["stack"],
    link: project.link ?? undefined,
  }));
}

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(({ id, ...testimonial }) => ({ id, ...testimonial }));
}

export async function createSkillGroup(input: SkillGroup): Promise<boolean> {
  await prisma.skillGroup.create({ data: input });
  return recomputeSetupState();
}

export async function getSetupComplete(): Promise<boolean> {
  const row = await prisma.setupState.findUnique({ where: { id: SINGLETON_ID } });
  return row?.isComplete ?? false;
}

export async function getEducation(): Promise<Education> {
  const row = await prisma.education.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return EMPTY_EDUCATION;
  const { id: _id, ...education } = row;
  return education;
}

export async function setEducation(input: Education): Promise<void> {
  await prisma.education.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...input },
    update: input,
  });
}

export async function getLanguages(): Promise<LanguageRow[]> {
  const rows = await prisma.language.findMany();
  return rows.map(({ id, ...language }) => ({ id, ...language }));
}

export async function getCvSnapshots() {
  return prisma.cvSnapshot.findMany({ orderBy: { createdAt: "desc" } });
}

// --- Locale configuration -------------------------------------------------
// Same merge-on-read / upsert-on-write shape as Theme and Section (see ADR-007):
// an untouched database still yields a complete, valid locale list. "en" is always
// enabled — there is no way to turn off the default language — and never needs a row
// to prove it; every other catalogue entry defaults to disabled until an admin first
// toggles it, at which point a real row is upserted.
export async function getLocales(): Promise<LocaleSetting[]> {
  const rows = await prisma.locale.findMany();
  const byCode = new Map(rows.map((row) => [row.code, row]));
  return LOCALE_CATALOGUE.map((entry, index) => {
    if (entry.code === DEFAULT_LOCALE) {
      return { code: entry.code, enabled: true, sortOrder: byCode.get(entry.code)?.sortOrder ?? 0 };
    }
    const row = byCode.get(entry.code);
    return row
      ? { code: entry.code, enabled: row.enabled, sortOrder: row.sortOrder }
      : { code: entry.code, enabled: false, sortOrder: index };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getEnabledLocales(): Promise<LocaleCode[]> {
  const locales = await getLocales();
  return locales.filter((l) => l.enabled).map((l) => l.code as LocaleCode);
}

export async function setLocale(code: LocaleCode, enabled: boolean): Promise<void> {
  if (code === DEFAULT_LOCALE) return; // the default locale can never be disabled
  const locales = await getLocales();
  const sortOrder = locales.find((l) => l.code === code)?.sortOrder ?? 0;
  await prisma.locale.upsert({
    where: { code },
    create: { code, enabled, sortOrder },
    update: { enabled },
  });
}

// --- Translations -----------------------------------------------------------
export async function getTranslationsForLocale(locale: string): Promise<Translation[]> {
  const rows = await prisma.translation.findMany({ where: { locale } });
  return rows.map((row) => ({
    entity: row.entity as TranslatableEntity,
    entityId: row.entityId,
    locale: row.locale as LocaleCode,
    values: row.values as Record<string, unknown>,
  }));
}

export async function getAllTranslations(): Promise<Translation[]> {
  const rows = await prisma.translation.findMany();
  return rows.map((row) => ({
    entity: row.entity as TranslatableEntity,
    entityId: row.entityId,
    locale: row.locale as LocaleCode,
    values: row.values as Record<string, unknown>,
  }));
}

export async function setTranslation(
  entity: TranslatableEntity,
  entityId: string,
  locale: string,
  values: Record<string, unknown>,
): Promise<void> {
  await prisma.translation.upsert({
    where: { entity_entityId_locale: { entity, entityId, locale } },
    create: { entity, entityId, locale, values: values as object },
    update: { values: values as object },
  });
}

export async function deleteTranslationsFor(
  entity: TranslatableEntity,
  entityId: string,
): Promise<void> {
  await prisma.translation.deleteMany({ where: { entity, entityId } });
}

export async function recomputeSetupState(): Promise<boolean> {
  const [profile, roles, skillGroups] = await Promise.all([
    prisma.profile.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.role.findMany(),
    prisma.skillGroup.findMany(),
  ]);

  const isComplete = requiredForSetupSchema.safeParse({
    profile,
    roles,
    skillGroups,
  }).success;

  await prisma.setupState.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, isComplete },
    update: { isComplete },
  });

  return isComplete;
}
