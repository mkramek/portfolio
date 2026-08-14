import { describe, expect, test } from "bun:test";
import {
  type EntityRow,
  fromRaw,
  localizeFieldSpecs,
  localizeListConfig,
  parseLines,
  parseTags,
  ROLE_FIELDS,
  toRaw,
  visibleFields,
} from "@/lib/admin/fields";
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

  test("preserves dependsOn through an override", () => {
    const localized = localizeFieldSpecs(ROLE_FIELDS, plAdmin.fields, "role");
    const bullets = localized.find((f) => f.key === "bullets");
    expect(bullets?.dependsOn).toEqual({ key: "depth", values: ["extended", "advanced"] });
  });
});

describe("parseLines / parseTags", () => {
  test("parseTags trims and drops empty entries", () => {
    expect(parseTags("TypeScript, , Go ")).toEqual(["TypeScript", "Go"]);
    expect(parseTags("")).toEqual([]);
  });

  test("parseLines trims and drops blank lines", () => {
    expect(parseLines("a\n\n  b  ")).toEqual(["a", "b"]);
  });
});

describe("fromRaw / toRaw round trip", () => {
  test("lines, tags and pairs survive a round trip", () => {
    const row: EntityRow = {
      id: "1",
      bullets: ["Shipped X", "Fixed Y"],
      stack: ["TypeScript", "Go"],
      metrics: [{ value: "99.9%", label: "uptime" }],
    };
    for (const key of ["bullets", "stack", "metrics"] as const) {
      const field = ROLE_FIELDS.find((f) => f.key === key);
      if (!field) throw new Error(`missing field ${key}`);
      expect(fromRaw(field, toRaw(field, row))).toEqual(row[key]);
    }
  });
});

describe("visibleFields", () => {
  const byKey = (fields: ReturnType<typeof visibleFields>) => fields.map((f) => f.key);

  test("simple depth hides bullets/metrics/stack and the case study", () => {
    const visible = byKey(visibleFields(ROLE_FIELDS, { depth: "simple" }));
    expect(visible).not.toContain("bullets");
    expect(visible).not.toContain("metrics");
    expect(visible).not.toContain("stack");
    expect(visible).not.toContain("caseStudy.context");
    expect(visible).toContain("company");
    expect(visible).toContain("oneLiner");
  });

  test("extended depth shows bullets/metrics/stack but not the case study", () => {
    const visible = byKey(visibleFields(ROLE_FIELDS, { depth: "extended" }));
    expect(visible).toContain("bullets");
    expect(visible).toContain("metrics");
    expect(visible).toContain("stack");
    expect(visible).not.toContain("caseStudy.context");
  });

  test("advanced depth shows every field", () => {
    const visible = byKey(visibleFields(ROLE_FIELDS, { depth: "advanced" }));
    expect(visible).toEqual(ROLE_FIELDS.map((f) => f.key));
  });

  test("a missing raw value hides a dependent field instead of throwing", () => {
    expect(() => visibleFields(ROLE_FIELDS, {})).not.toThrow();
    expect(byKey(visibleFields(ROLE_FIELDS, {}))).not.toContain("bullets");
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
