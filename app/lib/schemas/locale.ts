import { z } from "zod";
import { LOCALE_CODES, type LocaleCode } from "@/lib/i18n/config";

// Cast preserves the LocaleCode literal union through z.enum's tuple-typed overload —
// casting to `[string, ...string[]]` instead would widen `code` to plain `string`
// everywhere this schema's inferred type is used.
export const localeCodeSchema = z.enum(LOCALE_CODES as [LocaleCode, ...LocaleCode[]]);

export const localeSchema = z.object({
  code: localeCodeSchema,
  enabled: z.boolean(),
  sortOrder: z.number().int(),
});

export type LocaleSetting = z.infer<typeof localeSchema>;
