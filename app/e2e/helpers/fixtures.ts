import "./env";
import { prisma, type RoleData } from "./db";

export const TEST_PROFILE = {
  name: "Milosz Kramek",
  handle: "milosz",
  title: "Software Engineer",
  tagline: "I build resilient systems.",
  summary: "Full-stack engineer focused on reliability and developer experience.",
  email: "milosz@cv.dev",
  phone: "+48 600 000 000",
  location: "Warsaw",
  linkedin: "linkedin.com/in/milosz",
  github: "github.com/milosz",
  availability: "Available",
  heroStats: [{ value: "8+", label: "YEARS IN TECH" }],
  ledgerRows: [{ label: "LOCATION", value: "Warsaw" }],
};

export const TEST_ROLE: RoleData = {
  company: "Acme Inc.",
  title: "Staff Engineer",
  start: "Oct 2024",
  end: "Present",
  kind: "Contract · Remote",
  location: "Warsaw",
  depth: "extended",
  oneLiner: "Led the platform migration.",
  bullets: ["Cut deploy times by 40%."],
  metrics: [{ value: "99.9%", label: "uptime" }],
  stack: ["TypeScript", "Postgres", "Kubernetes"],
  caseStudy: { context: "Context", approach: "Approach", impact: "Impact" },
  includeInCv: true,
  sortOrder: 0,
};

export const TEST_PROJECT = {
  name: "Traffic Dashboard",
  role: "Solo engineer",
  year: "2025",
  blurb: "Real-time analytics for a logistics fleet.",
  stack: ["React", "Postgres"],
  includeInCv: true,
  sortOrder: 0,
};

export const TEST_SKILL_GROUP = {
  group: "Languages",
  items: ["TypeScript", "Go"],
  sortOrder: 0,
};

export const TEST_CV_SETTINGS = {
  company: "Acme Inc.",
  position: "Staff Engineer",
  summary: "Tailored summary for Acme.",
  includeSkills: true,
  includeProjects: true,
  includeTestimonials: false,
  includeEducation: true,
  includeLanguages: true,
};

export async function seedProfile(): Promise<void> {
  await prisma.profile.create({ id: "singleton", ...TEST_PROFILE });
}

export async function seedSetupBase(): Promise<void> {
  await seedProfile();
  await prisma.skillGroup.create(TEST_SKILL_GROUP);
}

export async function markSetupComplete(): Promise<void> {
  await prisma.setupState.upsert({ id: "singleton", isComplete: true });
}

export async function createRole(role: Partial<RoleData>): Promise<string> {
  const row = await prisma.role.create({ ...TEST_ROLE, ...role });
  return row.id;
}

export async function seedCompleteContent(): Promise<void> {
  await seedSetupBase();
  await createRole({});
  await prisma.project.create(TEST_PROJECT);
  await prisma.cvSettings.create(TEST_CV_SETTINGS);
  await markSetupComplete();
}
