import { z } from "zod";

export const languageSchema = z.object({
  name: z.string(),
  level: z.string(),
});

export type Language = z.infer<typeof languageSchema>;
