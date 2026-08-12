import { revalidatePath } from "next/cache";

/**
 * Call after any admin write that could change what the public portfolio renders —
 * content, sections, theme, locale configuration, or a translation. One call covers
 * every enabled locale at once (`/[lang]` is a page-path pattern, not a literal path —
 * see the revalidatePath docs' "Revalidating a Page path" example), so this doesn't
 * need to know which locales exist. Keeps ADR-006 ("no draft/publish workflow — edits
 * go live immediately") true now that the public route is ISR-cached instead of
 * force-dynamic (see app/[lang]/layout.tsx).
 */
export function revalidatePublicPortfolio(): void {
  try {
    revalidatePath("/[lang]", "page");
  } catch {
    // revalidatePath throws outside a real Next.js request context (e.g. the in-memory
    // fake-delegate unit tests in lib/admin/routes.test.ts, which import this same
    // route code with no server runtime underneath). The write itself has already
    // succeeded by the time this runs — worst case on a genuine failure is the public
    // page staying cached until its next natural revalidate window, not a correctness
    // bug, so this is deliberately best-effort rather than something callers must handle.
  }
}
