import { getPublicDictionary } from "@/lib/i18n/dictionaries";

// Fully static placeholder — no personalization, no database read beyond the
// isSetupComplete() check that routed here (see docs/arch/04-setup-publish-gate.md).
// It still reads the public dictionary via next/root-params (a small, in-memory
// server-only module import, not a DB round trip) so the one message it shows is in
// the visitor's locale.
export async function ComingSoon() {
  const dict = await getPublicDictionary();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 font-mono text-fg">
      <p className="text-xs uppercase tracking-widest text-dim">{dict.comingSoon.eyebrow}</p>
      <h1 className="mt-3 font-sans text-3xl font-semibold tracking-tight">
        {dict.comingSoon.title}
      </h1>
      <p className="mt-4 max-w-md text-center text-sm text-dim">{dict.comingSoon.body}</p>
    </main>
  );
}
