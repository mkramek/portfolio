import { describe, expect, test } from "bun:test";
import { rowCompleteness, summarize } from "@/lib/i18n/completeness";

describe("rowCompleteness", () => {
  test("a field with an empty English base is not counted as needing translation", () => {
    const base = { title: "Senior Engineer", tagline: "", summary: "A summary." };
    const row = rowCompleteness("profile", "singleton", base, undefined);
    // profile's translatable set includes title, tagline, summary, location, availability,
    // heroStats, ledgerRows — only title and summary are non-blank here.
    expect(row.needed).toBe(2);
    expect(row.filled).toBe(0);
  });

  test("counts a field as filled only when the translated value is non-blank", () => {
    const base = { title: "Senior Engineer", summary: "A summary." };
    const row = rowCompleteness("profile", "singleton", base, { title: "Starszy inżynier" });
    expect(row.needed).toBe(2);
    expect(row.filled).toBe(1);
  });
});

describe("summarize", () => {
  test("reports 100% when nothing needs translation", () => {
    expect(
      summarize([{ entity: "profile", entityId: "singleton", needed: 0, filled: 0 }]).percent,
    ).toBe(100);
  });

  test("aggregates needed/filled across rows into a percent", () => {
    const rows = [
      { entity: "role" as const, entityId: "a", needed: 4, filled: 2 },
      { entity: "role" as const, entityId: "b", needed: 6, filled: 6 },
    ];
    const result = summarize(rows);
    expect(result.needed).toBe(10);
    expect(result.filled).toBe(8);
    expect(result.percent).toBe(80);
  });
});
