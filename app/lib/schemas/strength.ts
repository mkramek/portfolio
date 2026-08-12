import { z } from "zod";

export const strengthSchema = z.object({
  tag: z.string(),
  title: z.string(),
  body: z.string(),
  sortOrder: z.number().int(),
});

export type Strength = z.infer<typeof strengthSchema>;
