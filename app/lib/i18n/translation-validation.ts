import { getPath } from "@/lib/admin/fields";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatable";
import type { TranslatableEntity } from "@/lib/schemas/translation";

/**
 * Structural validation for a translation PUT body — checks each *present* key against
 * the shape its FieldSpec type implies (string for text/area, string[] for lines,
 * {value,label}[] for pairs). Absent keys are fine (a translation is always partial);
 * unknown/mistyped values are rejected. Lighter than building a full per-entity Zod
 * schema, which would need to mirror dotted paths (e.g. "caseStudy.context") as nested
 * shapes — not worth it for an admin-only, already-authenticated endpoint.
 */
export function isValidTranslationValues(
  entity: TranslatableEntity,
  values: unknown,
): values is Record<string, unknown> {
  if (values === null || typeof values !== "object" || Array.isArray(values)) return false;
  const obj = values as Record<string, unknown>;
  for (const field of TRANSLATABLE_FIELDS[entity]) {
    const value = getPath(obj, field.key);
    if (value === undefined) continue;
    if (field.type === "lines") {
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return false;
    } else if (field.type === "pairs") {
      if (
        !Array.isArray(value) ||
        !value.every(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof (item as { value?: unknown }).value === "string" &&
            typeof (item as { label?: unknown }).label === "string",
        )
      ) {
        return false;
      }
    } else if (typeof value !== "string") {
      return false;
    }
  }
  return true;
}
