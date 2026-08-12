import { z } from "zod";
import { localeCodeSchema } from "@/lib/schemas/locale";

const resolvedRoleSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  kind: z.string(),
  location: z.string(),
  oneLiner: z.string(),
  bullets: z.array(z.string()),
  metrics: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  stack: z.array(z.string()),
  caseStudy: z.object({
    context: z.string(),
    approach: z.string(),
    impact: z.string(),
  }),
});

const resolvedProjectSchema = z.object({
  name: z.string(),
  role: z.string(),
  year: z.string(),
  blurb: z.string(),
  stack: z.array(z.string()),
});

const resolvedSkillGroupSchema = z.object({
  group: z.string(),
  items: z.array(z.string()),
});

const resolvedTestimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string(),
});

const resolvedEducationSchema = z.object({
  degree: z.string(),
  detail: z.string(),
});

const resolvedLanguageSchema = z.object({
  name: z.string(),
  level: z.string(),
});

export const cvSnapshotContentSchema = z.object({
  summary: z.string(),
  skills: z.array(resolvedSkillGroupSchema).optional(),
  roles: z.array(resolvedRoleSchema).optional(),
  projects: z.array(resolvedProjectSchema).optional(),
  testimonials: z.array(resolvedTestimonialSchema).optional(),
  education: resolvedEducationSchema.optional(),
  languages: z.array(resolvedLanguageSchema).optional(),
});

export const cvSnapshotSchema = z.object({
  company: z.string(),
  position: z.string(),
  snapshot: cvSnapshotContentSchema,
  locale: localeCodeSchema.default("en"),
});

export type CvSnapshotContent = z.infer<typeof cvSnapshotContentSchema>;
