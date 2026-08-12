import { z } from "zod";
import { localeCodeSchema } from "@/lib/schemas/locale";

export const translatableEntitySchema = z.enum([
  "profile",
  "role",
  "project",
  "skillGroup",
  "strength",
  "testimonial",
  "education",
  "language",
  "section",
  "cvSettings",
]);

export type TranslatableEntity = z.infer<typeof translatableEntitySchema>;

// `values` is intentionally a loose record — its shape is validated against the
// per-entity translatable field list in lib/i18n/translatable.ts, not here, since
// that list is a partial subset of each entity's own Zod schema and differs per
// entity. This schema only guarantees the sidecar row's own shape.
export const translationSchema = z.object({
  entity: translatableEntitySchema,
  entityId: z.string().min(1),
  locale: localeCodeSchema,
  values: z.record(z.string(), z.unknown()),
});

export type Translation = z.infer<typeof translationSchema>;
