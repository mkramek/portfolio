import { describe, expect, test } from "bun:test";
import { isBlank, localize } from "@/lib/i18n/localize";

describe("isBlank", () => {
  test("treats undefined, null, empty string, whitespace and empty array as blank", () => {
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank([])).toBe(true);
  });

  test("treats real content as not blank", () => {
    expect(isBlank("hello")).toBe(false);
    expect(isBlank(["a"])).toBe(false);
    expect(isBlank({ context: "x", approach: "", impact: "" })).toBe(false);
  });
});

describe("localize", () => {
  const base = {
    company: "Acme",
    title: "Senior Engineer",
    oneLiner: "Built things.",
    bullets: ["Shipped X", "Shipped Y"],
    sortOrder: 0,
  };

  test("overrides only translatable fields with non-blank translation values", () => {
    const merged = localize(base, "role", { title: "Starszy inżynier", oneLiner: "" });
    expect(merged.title).toBe("Starszy inżynier");
    // blank translation value falls back to English
    expect(merged.oneLiner).toBe("Built things.");
    // untranslatable / untouched fields pass through unchanged
    expect(merged.company).toBe("Acme");
    expect(merged.bullets).toEqual(["Shipped X", "Shipped Y"]);
    expect(merged.sortOrder).toBe(0);
  });

  test("passes the base through unchanged when there is no translation row", () => {
    expect(localize(base, "role", undefined)).toBe(base);
  });

  test("supports dotted field keys, stored nested (mirroring the base entity's own shape)", () => {
    const roleWithCaseStudy = { ...base, caseStudy: { context: "Ctx", approach: "", impact: "" } };
    const merged = localize(roleWithCaseStudy, "role", { caseStudy: { context: "Kontekst" } });
    expect(merged.caseStudy).toEqual({ context: "Kontekst", approach: "", impact: "" });
    // the original base object is untouched — no shared-reference mutation
    expect(roleWithCaseStudy.caseStudy.context).toBe("Ctx");
  });
});
