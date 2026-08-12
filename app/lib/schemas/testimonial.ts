import { z } from "zod";

export const testimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string(),
  includeInCv: z.boolean().default(false),
  sortOrder: z.number().int(),
});

export type Testimonial = z.infer<typeof testimonialSchema>;
