import { z } from "zod";

export const projectSchema = z.object({
  name: z.string(),
  role: z.string(),
  year: z.string(),
  blurb: z.string(),
  stack: z.array(z.string()),
  link: z.string().optional(),
  includeInCv: z.boolean().default(true),
  sortOrder: z.number().int(),
});

export type Project = z.infer<typeof projectSchema>;
