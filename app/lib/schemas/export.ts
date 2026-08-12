import { z } from "zod";
import { cvSettingsSchema } from "./cv-settings";
import { cvSnapshotSchema } from "./cv-snapshot";
import { educationSchema } from "./education";
import { languageSchema } from "./language";
import { localeSchema } from "./locale";
import { profileSchema } from "./profile";
import { projectSchema } from "./project";
import { roleSchema } from "./role";
import { sectionSchema } from "./section";
import { skillGroupSchema } from "./skill-group";
import { strengthSchema } from "./strength";
import { testimonialSchema } from "./testimonial";
import { themeSchema } from "./theme";
import { translationSchema } from "./translation";

const lenientProfileSchema = profileSchema.extend({
  name: z.string(),
  title: z.string(),
  summary: z.string(),
  email: z.string(),
});

const importedCvSnapshotSchema = cvSnapshotSchema.extend({
  id: z.string().optional(),
  createdAt: z.string().optional(),
});

export const exportSchema = z.object({
  profile: lenientProfileSchema,
  roles: z.array(roleSchema),
  projects: z.array(projectSchema),
  skillGroups: z.array(skillGroupSchema),
  strengths: z.array(strengthSchema),
  testimonials: z.array(testimonialSchema),
  education: educationSchema,
  languages: z.array(languageSchema),
  sections: z.array(sectionSchema),
  theme: themeSchema,
  cv: cvSettingsSchema,
  cvSnapshots: z.array(importedCvSnapshotSchema),
  // Backups taken before i18n shipped have neither key — defaulting to an empty array
  // keeps old exports importable unchanged, per the existing "additive" export contract.
  translations: z.array(translationSchema).default([]),
  locales: z.array(localeSchema).default([]),
});

export type ExportPayload = z.infer<typeof exportSchema>;
