import { describe, expect, test } from "bun:test";
import { roleSchema } from "./role";

const baseRole = {
  company: "Acme",
  title: "Staff Engineer",
  start: "Oct 2024",
  end: "Present",
  kind: "Contract · Remote",
  location: "Warsaw",
  depth: "extended",
  oneLiner: "Shipped platform work.",
  bullets: ["Led the migration"],
  metrics: [{ value: "99.9%", label: "uptime" }],
  stack: ["TypeScript", "Postgres"],
  caseStudy: { context: "c", approach: "a", impact: "i" },
  sortOrder: 0,
};

describe("roleSchema", () => {
  test("accepts a complete role", () => {
    expect(roleSchema.safeParse(baseRole).success).toBe(true);
  });

  test("defaults includeInCv to true when omitted", () => {
    const parsed = roleSchema.parse(baseRole);
    expect(parsed.includeInCv).toBe(true);
  });

  test("rejects an unknown depth", () => {
    expect(roleSchema.safeParse({ ...baseRole, depth: "super" }).success).toBe(false);
  });

  test("rejects a non-integer sortOrder", () => {
    expect(roleSchema.safeParse({ ...baseRole, sortOrder: 1.5 }).success).toBe(false);
  });

  test("rejects a metric row missing its label", () => {
    expect(
      roleSchema.safeParse({
        ...baseRole,
        metrics: [{ value: "99.9%" }],
      }).success,
    ).toBe(false);
  });

  test("rejects a role missing the case study object", () => {
    const { caseStudy: _omit, ...rest } = baseRole;
    expect(roleSchema.safeParse(rest).success).toBe(false);
  });

  test("requires bullets to be an array of strings", () => {
    expect(roleSchema.safeParse({ ...baseRole, bullets: "nope" }).success).toBe(false);
  });
});
