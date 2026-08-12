import { deleteTranslationsFor } from "@/lib/content";
import { prisma } from "@/lib/db";
import { projectSchema } from "@/lib/schemas/project";
import { roleSchema } from "@/lib/schemas/role";
import { skillGroupSchema } from "@/lib/schemas/skill-group";
import { strengthSchema } from "@/lib/schemas/strength";
import { testimonialSchema } from "@/lib/schemas/testimonial";
import type { Delegate, RouteEntityConfig } from "./routes";

export const rolesConfig: RouteEntityConfig = {
  name: "role",
  delegate: prisma.role as unknown as Delegate,
  schema: roleSchema,
  createSchema: roleSchema.omit({ sortOrder: true }),
  recompute: true,
  deleteTranslations: (id) => deleteTranslationsFor("role", id),
};

export const projectsConfig: RouteEntityConfig = {
  name: "project",
  delegate: prisma.project as unknown as Delegate,
  schema: projectSchema,
  createSchema: projectSchema.omit({ sortOrder: true }),
  recompute: false,
  deleteTranslations: (id) => deleteTranslationsFor("project", id),
};

export const skillGroupsConfig: RouteEntityConfig = {
  name: "skill group",
  delegate: prisma.skillGroup as unknown as Delegate,
  schema: skillGroupSchema,
  createSchema: skillGroupSchema.omit({ sortOrder: true }),
  recompute: true,
  deleteTranslations: (id) => deleteTranslationsFor("skillGroup", id),
};

export const strengthsConfig: RouteEntityConfig = {
  name: "strength",
  delegate: prisma.strength as unknown as Delegate,
  schema: strengthSchema,
  createSchema: strengthSchema.omit({ sortOrder: true }),
  recompute: false,
  deleteTranslations: (id) => deleteTranslationsFor("strength", id),
};

export const testimonialsConfig: RouteEntityConfig = {
  name: "testimonial",
  delegate: prisma.testimonial as unknown as Delegate,
  schema: testimonialSchema,
  createSchema: testimonialSchema.omit({ sortOrder: true }),
  recompute: false,
  deleteTranslations: (id) => deleteTranslationsFor("testimonial", id),
};
