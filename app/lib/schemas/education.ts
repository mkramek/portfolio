import { z } from "zod";

export const educationSchema = z.object({
  degree: z.string(),
  detail: z.string(),
});

export type Education = z.infer<typeof educationSchema>;
