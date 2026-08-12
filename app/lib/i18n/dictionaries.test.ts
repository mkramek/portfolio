import { describe, expect, test } from "bun:test";
import { LOCALE_CODES } from "@/lib/i18n/config";
import { loadDictionary } from "@/lib/i18n/dictionary-loader";

describe("loadDictionary", () => {
  for (const locale of LOCALE_CODES) {
    for (const namespace of ["public", "admin", "cv"] as const) {
      test(`resolves a "${namespace}" module for "${locale}"`, async () => {
        const dict = await loadDictionary(locale, namespace);
        expect(dict).toBeTruthy();
        expect(typeof dict).toBe("object");
      });
    }
  }

  test("en and pl public dictionaries carry the exact same key shape", async () => {
    const en = await loadDictionary("en", "public");
    const pl = await loadDictionary("pl", "public");
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(pl.experience).sort()).toEqual(Object.keys(en.experience).sort());
  });
});
