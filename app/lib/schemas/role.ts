import { z } from "zod";

export const metricSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const caseStudySchema = z.object({
  context: z.string(),
  approach: z.string(),
  impact: z.string(),
});

export const roleSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  kind: z.string(),
  location: z.string(),
  depth: z.enum(["simple", "extended", "advanced"]),
  oneLiner: z.string(),
  bullets: z.array(z.string()),
  metrics: z.array(metricSchema),
  stack: z.array(z.string()),
  caseStudy: caseStudySchema,
  includeInCv: z.boolean().default(true),
  sortOrder: z.number().int(),
});

export type Role = z.infer<typeof roleSchema>;
