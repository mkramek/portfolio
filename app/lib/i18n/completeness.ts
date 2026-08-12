import { getPath } from "@/lib/admin/fields";
import { isBlank } from "@/lib/i18n/localize";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatable";
import type { TranslatableEntity } from "@/lib/schemas/translation";

export type CompletenessRow = {
  entity: TranslatableEntity;
  entityId: string;
  /** How many of this row's translatable fields actually have English content. */
  needed: number;
  /** How many of those fields have a non-blank value in the target locale. */
  filled: number;
};

/**
 * A field only "needs" translation when the English base has something in it — an
 * empty field isn't missing a translation, it's just empty. This keeps completeness
 * honest for sparsely-filled content instead of always reading under 100%.
 */
export function rowCompleteness(
  entity: TranslatableEntity,
  entityId: string,
  base: Record<string, unknown>,
  translated: Record<string, unknown> | undefined,
): CompletenessRow {
  let needed = 0;
  let filled = 0;
  for (const field of TRANSLATABLE_FIELDS[entity]) {
    const baseValue = getPath(base, field.key);
    if (isBlank(baseValue)) continue;
    needed += 1;
    const translatedValue = translated ? getPath(translated, field.key) : undefined;
    if (!isBlank(translatedValue)) filled += 1;
  }
  return { entity, entityId, needed, filled };
}

export function summarize(rows: CompletenessRow[]): {
  needed: number;
  filled: number;
  percent: number;
} {
  const needed = rows.reduce((sum, row) => sum + row.needed, 0);
  const filled = rows.reduce((sum, row) => sum + row.filled, 0);
  return { needed, filled, percent: needed === 0 ? 100 : Math.round((filled / needed) * 100) };
}
