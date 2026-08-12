import { z } from "zod";
import { localeCodeSchema } from "@/lib/schemas/locale";

export const cvSettingsSchema = z.object({
  company: z.string(),
  position: z.string(),
  summary: z.string(),
  includeSkills: z.boolean(),
  includeProjects: z.boolean(),
  includeTestimonials: z.boolean(),
  includeEducation: z.boolean(),
  includeLanguages: z.boolean(),
  // The CV document's own content language — independent of whichever locale the admin
  // happens to be browsing the builder in. See docs/arch/11-i18n.md.
  locale: localeCodeSchema.default("en"),
});

export type CvSettings = z.infer<typeof cvSettingsSchema>;
