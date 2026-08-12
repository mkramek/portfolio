import { z } from "zod";

export const sectionSchema = z.object({
  id: z.enum(["hero", "strengths", "experience", "projects", "skills", "testimonials", "contact"]),
  label: z.string(),
  visible: z.boolean(),
  sortOrder: z.number().int(),
});

export type Section = z.infer<typeof sectionSchema>;
