type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

// Explicit interface, rather than deriving from `typeof en` with `as const` — deriving
// would infer every leaf as its literal English string, which then rejects Polish text
// as "not assignable" when pl/public.ts does `satisfies PublicDictionary`. Values here
// are meant to vary per locale; only the *keys* need to be guaranteed present.
export type PublicDictionary = {
  comingSoon: { eyebrow: string; title: string; body: string };
  hero: {
    engagementsDelivered: string;
    ledgerRole: string;
    ledgerBased: string;
    ledgerContact: string;
    status: string;
  };
  experience: {
    context: string;
    approach: string;
    impact: string;
    caseStudyOpen: string;
    caseStudyClose: string;
    ledgerOpen: string;
    ledgerClose: string;
    depth: { simple: string; extended: string; advanced: string };
    /**
     * Keyed by Intl.PluralRules category (English only ever produces "one"/"other";
     * Polish needs "few"/"many" too — see lib/i18n/plural.ts). `other` must always be
     * present as the fallback category.
     */
    rolesCount: PluralForms;
  };
};

// English source of truth for the public portfolio's UI chrome (not DB content —
// that's translated via the Translation sidecar, see lib/i18n/content.ts). Every
// other locale's public.ts is typed `satisfies PublicDictionary`, so a missing or
// misspelled key fails the build instead of silently falling back.
export const en: PublicDictionary = {
  comingSoon: {
    eyebrow: "cv",
    title: "Coming soon",
    body: "The site is being put together. Check back shortly.",
  },
  hero: {
    engagementsDelivered: "ENGAGEMENTS DELIVERED",
    ledgerRole: "ROLE",
    ledgerBased: "BASED",
    ledgerContact: "CONTACT",
    // Faux-terminal command literals are left untranslated in components/portfolio/hero.tsx
    // on purpose — "whoami" is a real shell command, not English prose; translating it
    // would break the illusion the terminal hero variant is going for.
    status: "status",
  },
  experience: {
    context: "CONTEXT",
    approach: "APPROACH",
    impact: "IMPACT",
    caseStudyOpen: "+ CASE STUDY",
    caseStudyClose: "− CASE STUDY",
    ledgerOpen: "OPEN",
    ledgerClose: "CLOSE",
    depth: { simple: "SIMPLE", extended: "EXTENDED", advanced: "ADVANCED" },
    rolesCount: { one: "ROLE", other: "ROLES" },
  },
};
