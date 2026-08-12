import type { FieldSpec } from "@/lib/admin/fields";
import type { TranslatableEntity } from "@/lib/schemas/translation";

// Declares which fields of each content entity carry translatable prose, reusing the
// same FieldSpec shape the admin CRUD forms already render through field-control.tsx —
// the Translations tab (components/admin/translations-view.tsx) is built from this list.
//
// Deliberately excluded: proper nouns that don't change between languages — company
// names, product/project names, people's names, and specific skill/technology tags
// (Profile.name/handle/email, Role.company/stack, Project.name/stack/link,
// Testimonial.author, SkillGroup.items).
export const TRANSLATABLE_FIELDS: Record<TranslatableEntity, FieldSpec[]> = {
  profile: [
    { key: "title", label: "TITLE", type: "text" },
    { key: "tagline", label: "TAGLINE", type: "area", rows: 3 },
    { key: "summary", label: "CV SUMMARY", type: "area", rows: 7 },
    { key: "location", label: "LOCATION", type: "text" },
    { key: "availability", label: "AVAILABILITY", type: "text" },
    { key: "heroStats", label: "STAT STRIP", type: "pairs", rows: 3, hint: "value | label" },
    { key: "ledgerRows", label: "DATA SHEET", type: "pairs", rows: 3, hint: "label | value" },
  ],
  role: [
    { key: "title", label: "ROLE TITLE", type: "text" },
    { key: "start", label: "START", type: "text" },
    { key: "end", label: "END", type: "text" },
    { key: "kind", label: "ENGAGEMENT", type: "text" },
    { key: "oneLiner", label: "ONE-LINER", type: "area", rows: 2 },
    { key: "bullets", label: "BULLETS", type: "lines", rows: 6 },
    { key: "metrics", label: "METRICS", type: "pairs", rows: 4, hint: "value | label" },
    { key: "caseStudy.context", label: "CASE — CONTEXT", type: "area", rows: 3 },
    { key: "caseStudy.approach", label: "CASE — APPROACH", type: "area", rows: 3 },
    { key: "caseStudy.impact", label: "CASE — IMPACT", type: "area", rows: 3 },
  ],
  project: [
    { key: "role", label: "YOUR ROLE / CONTEXT", type: "text" },
    { key: "year", label: "PERIOD", type: "text" },
    { key: "blurb", label: "DESCRIPTION", type: "area", rows: 4 },
  ],
  skillGroup: [{ key: "group", label: "GROUP", type: "text" }],
  strength: [
    { key: "tag", label: "TAG", type: "text" },
    { key: "title", label: "TITLE", type: "text" },
    { key: "body", label: "BODY", type: "area", rows: 4 },
  ],
  testimonial: [
    { key: "quote", label: "QUOTE", type: "area", rows: 5 },
    { key: "role", label: "AUTHOR ROLE", type: "text" },
  ],
  education: [
    { key: "degree", label: "DEGREE", type: "text" },
    { key: "detail", label: "DETAIL", type: "area", rows: 3 },
  ],
  language: [
    { key: "name", label: "LANGUAGE", type: "text" },
    { key: "level", label: "LEVEL", type: "text" },
  ],
  section: [{ key: "label", label: "SECTION LABEL", type: "text" }],
  cvSettings: [
    { key: "position", label: "TARGET ROLE", type: "text" },
    { key: "summary", label: "TAILORED SUMMARY", type: "area", rows: 7 },
  ],
};

export const TRANSLATABLE_ENTITIES = Object.keys(TRANSLATABLE_FIELDS) as TranslatableEntity[];
