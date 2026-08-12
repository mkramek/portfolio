import { randomUUID } from "node:crypto";
import "./env";
import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type RoleRow = {
  id: string;
  company: string;
  title: string;
  start: string;
  end: string;
  kind: string;
  location: string;
  depth: string;
  oneLiner: string;
  bullets: string[];
  metrics: unknown[];
  stack: string[];
  caseStudy: Record<string, unknown>;
  includeInCv: boolean;
  sortOrder: number;
};

export type SnapshotRow = {
  id: string;
  createdAt: Date;
  company: string;
  position: string;
  snapshot: unknown;
};

export type RoleData = Partial<Omit<RoleRow, "id">> & {
  company: string;
  title: string;
  start: string;
  end: string;
  kind: string;
  location: string;
  depth: string;
  oneLiner: string;
  sortOrder: number;
};

export const prisma = {
  profile: {
    async create(data: {
      id?: string;
      name: string;
      handle: string;
      title: string;
      tagline?: string | null;
      summary: string;
      email: string;
      phone?: string | null;
      location?: string | null;
      linkedin?: string | null;
      github?: string | null;
      availability?: string | null;
      heroStats?: unknown[] | null;
      ledgerRows?: unknown[] | null;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO "Profile"
          (id, name, handle, title, tagline, summary, email, phone, location, linkedin, github, availability, "heroStats", "ledgerRows")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          data.id ?? "singleton",
          data.name,
          data.handle,
          data.title,
          data.tagline ?? null,
          data.summary,
          data.email,
          data.phone ?? null,
          data.location ?? null,
          data.linkedin ?? null,
          data.github ?? null,
          data.availability ?? null,
          data.heroStats == null ? null : JSON.stringify(data.heroStats),
          data.ledgerRows == null ? null : JSON.stringify(data.ledgerRows),
        ],
      );
    },
  },
  role: {
    async create(data: RoleData): Promise<RoleRow> {
      const id = randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO "Role"
          (id, company, title, start, "end", kind, location, depth, "oneLiner", bullets, metrics, stack, "caseStudy", "includeInCv", "sortOrder")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          id,
          data.company,
          data.title,
          data.start,
          data.end,
          data.kind,
          data.location,
          data.depth,
          data.oneLiner,
          JSON.stringify(data.bullets ?? []),
          JSON.stringify(data.metrics ?? []),
          JSON.stringify(data.stack ?? []),
          JSON.stringify(data.caseStudy ?? {}),
          data.includeInCv ?? true,
          data.sortOrder,
        ],
      );
      return rows[0] as RoleRow;
    },
    async update(args: {
      where: { id: string };
      data: Partial<Omit<RoleRow, "id">>;
    }): Promise<RoleRow> {
      const values: unknown[] = [];
      const sets: string[] = [];
      for (const [key, value] of Object.entries(args.data)) {
        values.push(value);
        sets.push(`"${key}" = $${values.length}`);
      }
      values.push(args.where.id);
      const { rows } = await pool.query(
        `UPDATE "Role" SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
        values,
      );
      return rows[0] as RoleRow;
    },
    async findMany(args?: { orderBy?: { sortOrder?: "asc" | "desc" } }): Promise<RoleRow[]> {
      const { orderBy } = args ?? {};
      const orderClause =
        orderBy == null
          ? ""
          : `ORDER BY ${Object.entries(orderBy)
              .map(([column, direction]) => `"${column}" ${direction}`)
              .join(", ")}`;
      const { rows } = await pool.query(`SELECT * FROM "Role" ${orderClause}`);
      return rows as RoleRow[];
    },
    count: () => countRows("Role"),
  },
  cvSnapshot: {
    async findMany(args?: { orderBy?: { createdAt?: "asc" | "desc" } }): Promise<SnapshotRow[]> {
      const { orderBy } = args ?? {};
      const orderClause =
        orderBy == null
          ? ""
          : `ORDER BY ${Object.entries(orderBy)
              .map(([column, direction]) => `"${column}" ${direction}`)
              .join(", ")}`;
      const { rows } = await pool.query(`SELECT * FROM "CvSnapshot" ${orderClause}`);
      return rows as SnapshotRow[];
    },
    count: () => countRows("CvSnapshot"),
  },
  skillGroup: {
    async create(data: { group: string; items: string[]; sortOrder: number }): Promise<void> {
      await pool.query(
        `INSERT INTO "SkillGroup" (id, "group", items, "sortOrder")
         VALUES ($1,$2,$3,$4)`,
        [randomUUID(), data.group, JSON.stringify(data.items), data.sortOrder],
      );
    },
  },
  project: {
    async create(data: {
      name: string;
      role: string;
      year: string;
      blurb: string;
      stack: string[];
      includeInCv?: boolean;
      sortOrder: number;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO "Project" (id, name, role, year, blurb, stack, "includeInCv", "sortOrder")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          randomUUID(),
          data.name,
          data.role,
          data.year,
          data.blurb,
          JSON.stringify(data.stack),
          data.includeInCv ?? true,
          data.sortOrder,
        ],
      );
    },
  },
  cvSettings: {
    async create(data: {
      company: string;
      position: string;
      summary: string;
      includeSkills: boolean;
      includeProjects: boolean;
      includeTestimonials: boolean;
      includeEducation: boolean;
      includeLanguages: boolean;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO "CvSettings" (id, company, position, summary, "includeSkills", "includeProjects", "includeTestimonials", "includeEducation", "includeLanguages")
         VALUES ('singleton',$1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          data.company,
          data.position,
          data.summary,
          data.includeSkills,
          data.includeProjects,
          data.includeTestimonials,
          data.includeEducation,
          data.includeLanguages,
        ],
      );
    },
  },
  setupState: {
    async upsert(data: { id: string; isComplete: boolean }): Promise<void> {
      await pool.query(
        `INSERT INTO "SetupState" (id, "isComplete", "updatedAt")
         VALUES ($1,$2,NOW())
         ON CONFLICT (id) DO UPDATE SET "isComplete" = EXCLUDED."isComplete", "updatedAt" = NOW()`,
        [data.id, data.isComplete],
      );
    },
  },
};

async function countRows(table: string): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM "${table}"`);
  return (rows[0] as { c: number }).c;
}

const CONTENT_TABLES = [
  "CvSnapshot",
  "CvSettings",
  "Theme",
  "SetupState",
  "Profile",
  "Role",
  "Project",
  "SkillGroup",
  "Strength",
  "Testimonial",
  "Section",
  "Education",
  "Language",
  "Translation",
  "Locale",
];

export async function resetContentDb(): Promise<void> {
  for (const table of CONTENT_TABLES) {
    await pool.query(`DELETE FROM "${table}"`);
  }
}
