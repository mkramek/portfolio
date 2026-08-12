import { describe, expect, test } from "bun:test";
import { requiredForSetupSchema } from "./setup";

const profile = { name: "Milosz", title: "Engineer", summary: "Summary.", email: "m@cv.dev" };

const role = {
  company: "Acme",
  title: "Staff Engineer",
  start: "Oct 2024",
  end: "Present",
  kind: "Contract · Remote",
  location: "Warsaw",
  depth: "simple",
  oneLiner: "Shipped platform work.",
  bullets: [],
  metrics: [],
  stack: [],
  caseStudy: { context: "", approach: "", impact: "" },
  includeInCv: true,
  sortOrder: 0,
};

const skillGroup = { group: "Languages", items: ["TypeScript"], sortOrder: 0 };

describe("requiredForSetupSchema", () => {
  test("passes when profile, at least one role and one skill group are present", () => {
    const parsed = requiredForSetupSchema.safeParse({
      profile,
      roles: [role],
      skillGroups: [skillGroup],
    });
    expect(parsed.success).toBe(true);
  });

  test("fails when the profile has an empty name", () => {
    const parsed = requiredForSetupSchema.safeParse({
      profile: { ...profile, name: "" },
      roles: [role],
      skillGroups: [skillGroup],
    });
    expect(parsed.success).toBe(false);
  });

  test("fails when the profile is missing its email", () => {
    const { email: _omit, ...incomplete } = profile;
    const parsed = requiredForSetupSchema.safeParse({
      profile: incomplete,
      roles: [role],
      skillGroups: [skillGroup],
    });
    expect(parsed.success).toBe(false);
  });

  test("fails when there are no roles", () => {
    const parsed = requiredForSetupSchema.safeParse({
      profile,
      roles: [],
      skillGroups: [skillGroup],
    });
    expect(parsed.success).toBe(false);
  });

  test("fails when there are no skill groups", () => {
    const parsed = requiredForSetupSchema.safeParse({
      profile,
      roles: [role],
      skillGroups: [],
    });
    expect(parsed.success).toBe(false);
  });

  test("fails when profile is missing entirely", () => {
    const parsed = requiredForSetupSchema.safeParse({ roles: [role], skillGroups: [skillGroup] });
    expect(parsed.success).toBe(false);
  });

  test("an otherwise-valid role with an empty company still passes (lenient role schema)", () => {
    const parsed = requiredForSetupSchema.safeParse({
      profile,
      roles: [{ ...role, company: "" }],
      skillGroups: [skillGroup],
    });
    expect(parsed.success).toBe(true);
  });
});
