export type FieldType = "text" | "area" | "lines" | "pairs" | "tags" | "select" | "bool";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  rows?: number;
  hint?: string;
  boolLabel?: string;
  options?: { value: string; label: string }[];
  /**
   * Renders this field only when sibling field `key`'s raw value is one of `values`.
   * Display gate only — entity-view.tsx still seeds and saves the field, so hiding
   * never discards what's already typed. Declarative (not a predicate) because
   * FieldSpec[] crosses the Server -> Client boundary as props.
   */
  dependsOn?: { key: string; values: string[] };
};

export const ROLE_FIELDS: FieldSpec[] = [
  { key: "company", label: "COMPANY", type: "text" },
  { key: "title", label: "ROLE TITLE", type: "text" },
  { key: "start", label: "START", type: "text", hint: "e.g. Oct 2024" },
  { key: "end", label: "END", type: "text", hint: "e.g. Present" },
  { key: "kind", label: "ENGAGEMENT", type: "text", hint: "e.g. Contract · Remote" },
  { key: "location", label: "LOCATION", type: "text" },
  {
    key: "depth",
    label: "DETAIL LEVEL",
    type: "select",
    options: [
      { value: "simple", label: "SIMPLE" },
      { value: "extended", label: "EXTENDED" },
      { value: "advanced", label: "ADVANCED" },
    ],
    hint: "simple = one-liner · extended = metrics, bullets, stack · advanced = + case study",
  },
  { key: "oneLiner", label: "ONE-LINER", type: "area", rows: 2 },
  {
    key: "bullets",
    label: "BULLETS",
    type: "lines",
    rows: 6,
    hint: "One per line",
    dependsOn: { key: "depth", values: ["extended", "advanced"] },
  },
  {
    key: "metrics",
    label: "METRICS",
    type: "pairs",
    rows: 4,
    hint: "One per line: value | label",
    dependsOn: { key: "depth", values: ["extended", "advanced"] },
  },
  {
    key: "stack",
    label: "STACK",
    type: "tags",
    hint: "Comma separated",
    dependsOn: { key: "depth", values: ["extended", "advanced"] },
  },
  {
    key: "caseStudy.context",
    label: "CASE — CONTEXT",
    type: "area",
    rows: 3,
    dependsOn: { key: "depth", values: ["advanced"] },
  },
  {
    key: "caseStudy.approach",
    label: "CASE — APPROACH",
    type: "area",
    rows: 3,
    dependsOn: { key: "depth", values: ["advanced"] },
  },
  {
    key: "caseStudy.impact",
    label: "CASE — IMPACT",
    type: "area",
    rows: 3,
    dependsOn: { key: "depth", values: ["advanced"] },
  },
  { key: "includeInCv", label: "CV", type: "bool", boolLabel: "Include in CV export" },
];

export const PROJECT_FIELDS: FieldSpec[] = [
  { key: "name", label: "PROJECT", type: "text" },
  { key: "role", label: "YOUR ROLE / CONTEXT", type: "text" },
  { key: "year", label: "PERIOD", type: "text" },
  { key: "blurb", label: "DESCRIPTION", type: "area", rows: 4 },
  { key: "stack", label: "STACK", type: "tags", hint: "Comma separated" },
  { key: "link", label: "LINK", type: "text", hint: "Optional" },
  { key: "includeInCv", label: "CV", type: "bool", boolLabel: "Include in CV export" },
];

export const SKILL_GROUP_FIELDS: FieldSpec[] = [
  { key: "group", label: "GROUP", type: "text" },
  { key: "items", label: "SKILLS", type: "tags", hint: "Comma separated" },
];

export const STRENGTH_FIELDS: FieldSpec[] = [
  { key: "tag", label: "TAG", type: "text" },
  { key: "title", label: "TITLE", type: "text" },
  { key: "body", label: "BODY", type: "area", rows: 4 },
];

export const TESTIMONIAL_FIELDS: FieldSpec[] = [
  { key: "quote", label: "QUOTE", type: "area", rows: 5 },
  { key: "author", label: "AUTHOR", type: "text" },
  { key: "role", label: "AUTHOR ROLE", type: "text" },
  { key: "includeInCv", label: "CV", type: "bool", boolLabel: "Include as reference in CV" },
];

export const PROFILE_FIELDS: FieldSpec[] = [
  { key: "name", label: "NAME", type: "text" },
  { key: "handle", label: "HANDLE", type: "text", hint: "e.g. milosz" },
  { key: "title", label: "TITLE", type: "text" },
  { key: "tagline", label: "TAGLINE", type: "area", rows: 3 },
  { key: "availability", label: "AVAILABILITY", type: "text" },
  { key: "email", label: "EMAIL", type: "text" },
  { key: "phone", label: "PHONE", type: "text" },
  { key: "location", label: "LOCATION", type: "text" },
  { key: "linkedin", label: "LINKEDIN", type: "text" },
  { key: "github", label: "GITHUB", type: "text" },
  { key: "summary", label: "CV SUMMARY", type: "area", rows: 7 },
  {
    key: "heroStats",
    label: "STAT STRIP",
    type: "pairs",
    rows: 3,
    hint: "One per line: value | label",
  },
  {
    key: "ledgerRows",
    label: "DATA SHEET",
    type: "pairs",
    rows: 3,
    hint: "One per line: label | value",
  },
];

export const EDUCATION_FIELDS: FieldSpec[] = [
  { key: "degree", label: "DEGREE", type: "text" },
  { key: "detail", label: "DETAIL", type: "area", rows: 3 },
];

/** Filters out fields whose `dependsOn` sibling value isn't currently satisfied. */
export function visibleFields(fields: FieldSpec[], raw: Record<string, string>): FieldSpec[] {
  return fields.filter(
    (field) => !field.dependsOn || field.dependsOn.values.includes(raw[field.dependsOn.key] ?? ""),
  );
}

/**
 * Applies dictionary label/hint/option overrides onto a structural FieldSpec list.
 * `prefix` is the entity key used in the admin dictionary's flat `fields` map (e.g.
 * "role", "profile") — see lib/i18n/dictionaries/en/admin.ts. A field with no matching
 * dictionary entry (or a locale missing that one key) just keeps its English default,
 * so this is purely additive and never throws on a partial dictionary.
 */
export function localizeFieldSpecs(
  fields: FieldSpec[],
  overrides: Record<
    string,
    { label: string; hint?: string; boolLabel?: string; options?: Record<string, string> }
  >,
  prefix: string,
): FieldSpec[] {
  return fields.map((field) => {
    const override = overrides[`${prefix}.${field.key}`];
    if (!override) return field;
    return {
      ...field,
      label: override.label,
      hint: override.hint ?? field.hint,
      boolLabel: override.boolLabel ?? field.boolLabel,
      options: field.options?.map((option) => ({
        ...option,
        label: override.options?.[option.value] ?? option.label,
      })),
    };
  });
}

export function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
      obj,
    );
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = current[parts[i]];
    if (!next || typeof next !== "object") current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export type EntityRow = { id: string } & Record<string, unknown>;

export function toRaw(field: FieldSpec, row?: EntityRow | null): string {
  const value = row ? getPath(row, field.key) : undefined;
  if (field.type === "lines") return Array.isArray(value) ? value.join("\n") : "";
  if (field.type === "tags") return Array.isArray(value) ? value.join(", ") : "";
  if (field.type === "pairs") {
    if (!Array.isArray(value)) return "";
    return value
      .map((item) => {
        const pair = item as { value?: string; label?: string };
        return `${pair.value ?? ""} | ${pair.label ?? ""}`;
      })
      .join("\n");
  }
  if (field.type === "bool") return value ? "1" : "0";
  return value == null ? "" : String(value);
}

export function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function parsePairs(raw: string): { value: string; label: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("|");
      return i < 0
        ? { value: line, label: "" }
        : { value: line.slice(0, i).trim(), label: line.slice(i + 1).trim() };
    });
}

export function fromRaw(field: FieldSpec, raw: string | undefined): unknown {
  const value = raw ?? "";
  if (field.type === "lines") return parseLines(value);
  if (field.type === "tags") return parseTags(value);
  if (field.type === "pairs") return parsePairs(value);
  if (field.type === "bool") return value === "1";
  return value;
}

export type ListEntity = "roles" | "projects" | "skills" | "strengths" | "testimonials";

export type ListConfig = {
  entity: ListEntity;
  title: string;
  help: string;
  apiBase: string;
  fields: FieldSpec[];
  columns: string[];
  columnWidths: string[];
  colTemplate: string;
  cells: (row: EntityRow) => string[];
  hasCvToggle: boolean;
  labelOf: (row: EntityRow) => string;
};

const actionsWidth = "168px";

function config(
  entity: ListEntity,
  title: string,
  help: string,
  apiBase: string,
  fields: FieldSpec[],
  columns: Array<[string, string]>,
  cells: (row: EntityRow) => string[],
  hasCvToggle: boolean,
  labelOf: (row: EntityRow) => string,
): ListConfig {
  return {
    entity,
    title,
    help,
    apiBase,
    fields,
    columns: columns.map(([label]) => label),
    columnWidths: columns.map(([, template]) => template),
    colTemplate: `${columns.map(([, template]) => template).join(" ")} ${actionsWidth}`,
    cells,
    hasCvToggle,
    labelOf,
  };
}

const cvLabel = (row: EntityRow) =>
  String(row.company ?? "") ||
  String(row.name ?? "") ||
  String(row.group ?? "") ||
  String(row.author ?? "") ||
  String(row.title ?? "") ||
  "this entry";

export const LIST_CONFIGS: Record<ListEntity, ListConfig> = {
  roles: config(
    "roles",
    "Experience",
    "Each role carries a detail level: simple, extended or advanced.",
    "/api/admin/roles",
    ROLE_FIELDS,
    [
      ["PERIOD", "148px"],
      ["COMPANY", "minmax(0,1fr)"],
      ["ROLE", "minmax(0,1fr)"],
      ["DETAIL", "86px"],
    ],
    (row) => [
      `${row.start ?? ""} – ${row.end ?? ""}`,
      String(row.company ?? ""),
      String(row.title ?? ""),
      String(row.depth ?? "").toUpperCase(),
    ],
    true,
    cvLabel,
  ),
  projects: config(
    "projects",
    "Projects",
    "Case-study entries shown under Selected Work.",
    "/api/admin/projects",
    PROJECT_FIELDS,
    [
      ["PROJECT", "minmax(0,1fr)"],
      ["CONTEXT", "minmax(0,1.2fr)"],
      ["PERIOD", "110px"],
    ],
    (row) => [String(row.name ?? ""), String(row.role ?? ""), String(row.year ?? "")],
    true,
    cvLabel,
  ),
  skills: config(
    "skills",
    "Skills",
    "Grouped rows — order here is order on the page and in the CV.",
    "/api/admin/skill-groups",
    SKILL_GROUP_FIELDS,
    [
      ["GROUP", "150px"],
      ["SKILLS", "minmax(0,1fr)"],
    ],
    (row) => [String(row.group ?? ""), Array.isArray(row.items) ? row.items.join(", ") : ""],
    false,
    cvLabel,
  ),
  strengths: config(
    "strengths",
    "Strengths",
    "The three cards under the intro.",
    "/api/admin/strengths",
    STRENGTH_FIELDS,
    [
      ["TAG", "150px"],
      ["TITLE", "minmax(0,1fr)"],
      ["BODY", "minmax(0,1.4fr)"],
    ],
    (row) => [String(row.tag ?? ""), String(row.title ?? ""), String(row.body ?? "")],
    false,
    cvLabel,
  ),
  testimonials: config(
    "testimonials",
    "References",
    "Replace the placeholders with real quotes before publishing.",
    "/api/admin/testimonials",
    TESTIMONIAL_FIELDS,
    [
      ["AUTHOR", "160px"],
      ["ROLE", "minmax(0,1fr)"],
      ["QUOTE", "minmax(0,1.6fr)"],
    ],
    (row) => [String(row.author ?? ""), String(row.role ?? ""), String(row.quote ?? "")],
    true,
    cvLabel,
  ),
};

/** The dictionary's `fields` map is keyed by singular entity name, not the plural list-entity id. */
const SINGULAR_ENTITY: Record<ListEntity, string> = {
  roles: "role",
  projects: "project",
  skills: "skillGroup",
  strengths: "strength",
  testimonials: "testimonial",
};

type ListsDict = Record<ListEntity, { title: string; help: string; columns: string[] }>;
type FieldsDict = Record<
  string,
  { label: string; hint?: string; boolLabel?: string; options?: Record<string, string> }
>;

/**
 * Builds a locale-specific ListConfig: labels/help/columns from the admin dictionary's
 * `lists` map, field labels via localizeFieldSpecs, and — for `roles` specifically —
 * the DETAIL column's raw enum value (`row.depth`) run through the same depth-option
 * translations the field editor uses, so the dense table view doesn't leak an English
 * enum value into an otherwise fully localized panel.
 */
export function localizeListConfig(
  entity: ListEntity,
  lists: ListsDict,
  fields: FieldsDict,
): ListConfig {
  const base = LIST_CONFIGS[entity];
  const dict = lists[entity];
  const localizedFields = localizeFieldSpecs(base.fields, fields, SINGULAR_ENTITY[entity]);
  const columns = dict.columns.map((label, i): [string, string] => [
    label,
    base.columnWidths[i] ?? "",
  ]);
  const depthOptions = fields[`${SINGULAR_ENTITY[entity]}.depth`]?.options;
  const cells =
    entity === "roles" && depthOptions
      ? (row: EntityRow) => {
          const [period, company, title, depth] = base.cells(row);
          return [period, company, title, depthOptions[String(row.depth ?? "")] ?? depth];
        }
      : base.cells;
  return config(
    entity,
    dict.title,
    dict.help,
    base.apiBase,
    localizedFields,
    columns,
    cells,
    base.hasCvToggle,
    base.labelOf,
  );
}
