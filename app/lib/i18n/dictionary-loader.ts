import type { LocaleCode } from "./config";
import type { AdminDictionary } from "./dictionaries/en/admin";
import type { CvDictionary } from "./dictionaries/en/cv";
import type { PublicDictionary } from "./dictionaries/en/public";

// Server-only, dynamically-imported dictionaries — see docs/arch/11-i18n.md. Each
// namespace is a separate module per locale so a page that only needs, say, the
// public dictionary never pulls the (much larger) admin dictionary into its server
// module graph, and none of it ever reaches the client: components receive already-
// resolved strings as props, never a dictionary object.
//
// Kept in its own module, apart from dictionaries.ts, specifically so it has no
// `next/root-params` import — that module can only be evaluated inside a Next.js
// request (it throws on plain `bun test`), while `loadDictionary` itself just needs a
// locale value and is exercised directly in lib/i18n/dictionaries.test.ts.
const loaders = {
  en: {
    public: () => import("./dictionaries/en/public").then((m) => m.en),
    admin: () => import("./dictionaries/en/admin").then((m) => m.en),
    cv: () => import("./dictionaries/en/cv").then((m) => m.en),
  },
  pl: {
    public: () => import("./dictionaries/pl/public").then((m) => m.pl),
    admin: () => import("./dictionaries/pl/admin").then((m) => m.pl),
    cv: () => import("./dictionaries/pl/cv").then((m) => m.pl),
  },
} satisfies Record<
  LocaleCode,
  {
    public: () => Promise<PublicDictionary>;
    admin: () => Promise<AdminDictionary>;
    cv: () => Promise<CvDictionary>;
  }
>;

export async function loadDictionary<N extends "public" | "admin" | "cv">(
  locale: LocaleCode,
  namespace: N,
): Promise<
  N extends "public" ? PublicDictionary : N extends "admin" ? AdminDictionary : CvDictionary
> {
  // biome-ignore lint/suspicious/noExplicitAny: the conditional return type isn't inferrable back through the indexed loader call
  return loaders[locale][namespace]() as any;
}
