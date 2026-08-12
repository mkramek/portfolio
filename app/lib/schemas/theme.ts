import { z } from "zod";

export const themeSchema = z.object({
  mode: z.enum(["light", "dark"]),
  accent: z.enum(["teal", "amber", "lime", "violet"]),
  hero: z.enum(["monolith", "terminal", "ledger"]),
  timeline: z.enum(["rail", "ledger", "cards"]),
  project: z.enum(["index", "window", "plain"]),
  admin: z.enum(["split", "stacked"]),
});

export type Theme = z.infer<typeof themeSchema>;
