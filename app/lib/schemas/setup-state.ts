import { z } from "zod";

export const setupStateSchema = z.object({
  isComplete: z.boolean(),
});

export type SetupState = z.infer<typeof setupStateSchema>;
