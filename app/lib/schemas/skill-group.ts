import { z } from "zod";

export const skillGroupSchema = z.object({
  group: z.string(),
  items: z.array(z.string()),
  sortOrder: z.number().int(),
});

export type SkillGroup = z.infer<typeof skillGroupSchema>;
