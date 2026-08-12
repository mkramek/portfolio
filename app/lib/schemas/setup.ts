import { z } from "zod";
import { roleSchema } from "./role";
import { skillGroupSchema } from "./skill-group";

export const requiredForSetupSchema = z.object({
  profile: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    email: z.string().min(1),
    summary: z.string().min(1),
  }),
  roles: z.array(roleSchema).min(1),
  skillGroups: z.array(skillGroupSchema).min(1),
});

export type RequiredForSetup = z.infer<typeof requiredForSetupSchema>;
