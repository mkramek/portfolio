import { z } from "zod";

export const heroStatsSchema = z.array(
  z.object({
    value: z.string(),
    label: z.string(),
  }),
);

export const ledgerRowsSchema = z.array(
  z.object({
    label: z.string(),
    value: z.string(),
  }),
);

export const profileSchema = z.object({
  name: z.string().min(1),
  handle: z.string(),
  title: z.string().min(1),
  tagline: z.string().optional(),
  summary: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  availability: z.string().optional(),
  heroStats: heroStatsSchema.optional(),
  ledgerRows: ledgerRowsSchema.optional(),
});

export type Profile = z.infer<typeof profileSchema>;
