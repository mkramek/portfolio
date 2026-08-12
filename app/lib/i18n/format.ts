/**
 * Interpolates `{key}` placeholders in a dictionary template string. Dictionary entries
 * that need a runtime value (a count, a label) are stored as plain template strings —
 * not functions — specifically so the whole dictionary object stays JSON-serializable
 * and can cross the Server -> Client Component boundary as a prop. Functions can't
 * (React errors: "Functions cannot be passed directly to Client Components"); import
 * this helper directly into the client component that needs it instead.
 */
export function formatTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
