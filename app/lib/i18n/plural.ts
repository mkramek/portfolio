type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/**
 * Resolves a pluralized dictionary entry for `count` in `locale` using Intl.PluralRules
 * (built into the JS runtime — no library needed). English only ever selects "one" or
 * "other"; Polish also uses "few" (2–4) and "many" (5+, and 0) — see the CLDR plural
 * rules for `pl`. Falls back to `forms.other` if the selected category isn't provided.
 */
export function pluralize(locale: string, count: number, forms: PluralForms): string {
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category] ?? forms.other;
}
