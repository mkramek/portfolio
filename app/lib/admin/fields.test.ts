import { describe, expect, test } from "bun:test";
import { localizeFieldSpecs, localizeListConfig, ROLE_FIELDS } from "@/lib/admin/fields";
import { en as enAdmin } from "@/lib/i18n/dictionaries/en/admin";
import { pl as plAdmin } from "@/lib/i18n/dictionaries/pl/admin";

describe("localizeFieldSpecs", () => {
  test("overrides label/hint/options from the dictionary, keyed by entity prefix", () => {
    const localized = localizeFieldSpecs(ROLE_FIELDS, plAdmin.fields, "role");
    const company = localized.find((f) => f.key === "company");
    const depth = localized.find((f) => f.key === "depth");
    expect(company?.label).toBe("FIRMA");
    expect(depth?.options?.find((o) => o.value === "simple")?.label).toBe("PROSTY");
  });

  test("falls back to the field's own English default when a key is missing", () => {
    const localized = localizeFieldSpecs(ROLE_FIELDS, {}, "role");
    expect(localized).toEqual(ROLE_FIELDS);
  });
});

describe("localizeListConfig", () => {
  test("builds a localized config with translated columns and depth-option cell values", () => {
    const config = localizeListConfig("roles", plAdmin.lists, plAdmin.fields);
    expect(config.title).toBe("Doświadczenie");
    expect(config.columns).toEqual(["OKRES", "FIRMA", "ROLA", "SZCZEGÓŁY"]);
    const cells = config.cells({
      id: "1",
      start: "Jan",
      end: "Feb",
      company: "Acme",
      title: "Eng",
      depth: "advanced",
    });
    expect(cells[3]).toBe("ZAAWANSOWANY");
  });

  test("en and pl produce the same column count and widths", () => {
    const enConfig = localizeListConfig("roles", enAdmin.lists, enAdmin.fields);
    const plConfig = localizeListConfig("roles", plAdmin.lists, plAdmin.fields);
    expect(plConfig.columnWidths).toEqual(enConfig.columnWidths);
    expect(plConfig.columns.length).toBe(enConfig.columns.length);
  });
});
