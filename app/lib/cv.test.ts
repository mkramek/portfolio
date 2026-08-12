import { beforeEach, describe, expect, test } from "bun:test";
import {
  createCvSnapshot,
  cvContactLine,
  cvHeadline,
  getCvSnapshotById,
  getCvSnapshotsWithVersions,
  resolveLiveCv,
} from "./cv";
import { prisma } from "./db";
import type { CvSettings } from "./schemas/cv-settings";
import type { CvSnapshotContent } from "./schemas/cv-snapshot";
import type { Profile } from "./schemas/profile";

const hasDb = Boolean(process.env.TEST_DATABASE_URL);
const dbDescribe = hasDb ? describe : describe.skip;

const cv: CvSettings = {
  company: "Acme",
  position: "Staff Engineer",
  summary: "Tailored summary.",
  includeSkills: true,
  includeProjects: true,
  includeTestimonials: false,
  includeEducation: true,
  includeLanguages: true,
  locale: "en",
};

const content: CvSnapshotContent = { summary: "Frozen summary.", roles: [] };

const profile: Profile = {
  name: "Milosz",
  handle: "milosz",
  title: "Engineer",
  summary: "Summary.",
  email: "m@cv.dev",
  phone: "+48 000",
  linkedin: "https://linkedin.com/in/x",
  location: "Warsaw",
};

describe("cvHeadline", () => {
  test("joins position and company with @", () => {
    expect(cvHeadline(cv, profile)).toBe("Staff Engineer @ Acme");
  });

  test("falls back to the profile title when the CV is untargeted", () => {
    expect(cvHeadline({ ...cv, position: "", company: "" }, profile)).toBe("Engineer");
  });
});

describe("cvContactLine", () => {
  test("joins contact fields with a separator, skipping empties", () => {
    expect(cvContactLine(profile)).toBe(
      "m@cv.dev  |  +48 000  |  https://linkedin.com/in/x  |  Warsaw",
    );
  });

  test("handles an email-only profile", () => {
    expect(
      cvContactLine({ ...profile, phone: undefined, linkedin: undefined, location: undefined }),
    ).toBe("m@cv.dev");
  });
});

dbDescribe("snapshot versioning", () => {
  beforeEach(async () => {
    await prisma.cvSnapshot.deleteMany();
  });

  async function insert(company: string, position: string, createdAt: Date, summary: string) {
    return prisma.cvSnapshot.create({
      data: {
        company,
        position,
        createdAt,
        snapshot: { summary, roles: [] } as object,
      },
    });
  }

  test("two downloads for the same company+position produce v1 and v2", async () => {
    await insert("Acme", "Staff", new Date("2026-01-01T00:00:00Z"), "first");
    await insert("Acme", "Staff", new Date("2026-01-02T00:00:00Z"), "second");
    await insert("Beta", "Engineer", new Date("2026-01-03T00:00:00Z"), "other");

    const rows = await getCvSnapshotsWithVersions();
    const acme = rows.filter((row) => row.company === "Acme");
    expect(acme.map((row) => row.version)).toEqual([2, 1]);
    expect(acme[0]?.snapshot.summary).toBe("second");
  });

  test("deleting v1 renumbers the remaining snapshot to v1", async () => {
    const first = await insert("Acme", "Staff", new Date("2026-01-01T00:00:00Z"), "first");
    await insert("Acme", "Staff", new Date("2026-01-02T00:00:00Z"), "second");

    await prisma.cvSnapshot.delete({ where: { id: first.id } });

    const rows = await getCvSnapshotsWithVersions();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.version).toBe(1);
    expect(rows[0]?.snapshot.summary).toBe("second");
  });

  test("getCvSnapshotById computes version against siblings only", async () => {
    await insert("Acme", "Staff", new Date("2026-01-01T00:00:00Z"), "first");
    const second = await insert("Acme", "Staff", new Date("2026-01-02T00:00:00Z"), "second");
    await insert("Beta", "Engineer", new Date("2026-01-03T00:00:00Z"), "other");

    const row = await getCvSnapshotById(second.id);
    expect(row?.version).toBe(2);
  });

  test("createCvSnapshot stores the exact content passed in", async () => {
    await createCvSnapshot(cv, content);
    const rows = await prisma.cvSnapshot.findMany();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row).toBeDefined();
    expect((row.snapshot as CvSnapshotContent).summary).toBe("Frozen summary.");
    expect(row.company).toBe("Acme");
    expect(row.locale).toBe("en");
  });

  test("createCvSnapshot freezes the CV's own content locale, not the default", async () => {
    await createCvSnapshot({ ...cv, locale: "pl" }, content);
    const rows = await prisma.cvSnapshot.findMany();
    expect(rows[0]?.locale).toBe("pl");
  });
});

dbDescribe("resolveLiveCv locale", () => {
  beforeEach(async () => {
    await prisma.cvSettings.deleteMany();
    await prisma.role.deleteMany();
    await prisma.translation.deleteMany();
  });

  test("merges a role translation for the requested locale, falling back per-field", async () => {
    const role = await prisma.role.create({
      data: {
        company: "Acme",
        title: "Engineer",
        start: "2024",
        end: "Present",
        kind: "Full-time",
        location: "Remote",
        depth: "simple",
        oneLiner: "Built the thing.",
        bullets: [],
        metrics: [],
        stack: [],
        caseStudy: { context: "", approach: "", impact: "" },
        sortOrder: 0,
      },
    });
    await prisma.translation.create({
      data: { entity: "role", entityId: role.id, locale: "pl", values: { title: "Inżynier" } },
    });

    const resolved = await resolveLiveCv("pl");
    const resolvedRole = resolved.roles?.[0];
    expect(resolvedRole?.title).toBe("Inżynier");
    expect(resolvedRole?.company).toBe("Acme"); // proper noun, never translated
    expect(resolvedRole?.oneLiner).toBe("Built the thing."); // untranslated field falls back to English
  });
});
