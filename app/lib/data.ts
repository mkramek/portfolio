import {
  getAllTranslations,
  getCvSettings,
  getCvSnapshots,
  getEducation,
  getLanguages,
  getLocales,
  getProfile,
  getProjects,
  getRoles,
  getSections,
  getSkillGroups,
  getStrengths,
  getTestimonials,
  getTheme,
  recomputeSetupState,
} from "./content";
import { prisma } from "./db";
import { SINGLETON_ID } from "./defaults";
import type { ExportPayload } from "./schemas/export";

export async function exportAll() {
  const [
    profile,
    roles,
    projects,
    skillGroups,
    strengths,
    testimonials,
    education,
    languages,
    sections,
    theme,
    cv,
    cvSnapshots,
    translations,
    locales,
  ] = await Promise.all([
    getProfile(),
    getRoles(),
    getProjects(),
    getSkillGroups(),
    getStrengths(),
    getTestimonials(),
    getEducation(),
    getLanguages(),
    getSections(),
    getTheme(),
    getCvSettings(),
    getCvSnapshots(),
    // Effective (merged-with-defaults) values, same as theme/sections — see
    // docs/arch/02-data-model.md "JSON export/import shape".
    getAllTranslations(),
    getLocales(),
  ]);

  return {
    profile,
    roles,
    projects,
    skillGroups,
    strengths,
    testimonials,
    education,
    languages,
    sections,
    theme,
    cv,
    cvSnapshots,
    translations,
    locales,
  };
}

export async function importAll(data: ExportPayload): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data.profile },
      update: data.profile,
    });
    await tx.role.deleteMany();
    await tx.role.createMany({ data: data.roles });
    await tx.project.deleteMany();
    await tx.project.createMany({ data: data.projects });
    await tx.skillGroup.deleteMany();
    await tx.skillGroup.createMany({ data: data.skillGroups });
    await tx.strength.deleteMany();
    await tx.strength.createMany({ data: data.strengths });
    await tx.testimonial.deleteMany();
    await tx.testimonial.createMany({ data: data.testimonials });
    await tx.education.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data.education },
      update: data.education,
    });
    await tx.language.deleteMany();
    await tx.language.createMany({ data: data.languages });
    await tx.section.deleteMany();
    await tx.section.createMany({ data: data.sections });
    await tx.theme.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data.theme },
      update: data.theme,
    });
    await tx.cvSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data.cv },
      update: data.cv,
    });
    await tx.cvSnapshot.deleteMany();
    await tx.cvSnapshot.createMany({
      data: data.cvSnapshots.map((snapshot) => ({
        company: snapshot.company,
        position: snapshot.position,
        snapshot: snapshot.snapshot as object,
        locale: snapshot.locale,
        createdAt: snapshot.createdAt ? new Date(snapshot.createdAt) : new Date(),
      })),
    });
    await tx.translation.deleteMany();
    await tx.translation.createMany({
      data: data.translations.map((translation) => ({
        entity: translation.entity,
        entityId: translation.entityId,
        locale: translation.locale,
        values: translation.values as object,
      })),
    });
    await tx.locale.deleteMany();
    await tx.locale.createMany({ data: data.locales });
  });
  await recomputeSetupState();
}
