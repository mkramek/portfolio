// See lib/i18n/dictionaries/en/public.ts for why this is a hand-written interface
// rather than `typeof en` derived from a `const` literal.
export type CvDictionary = {
  screenHeader: { untitled: string; cvExport: string; backToBuilder: string };
  frozenBadge: string;
  sections: {
    summary: string;
    skills: string;
    experience: string;
    projects: string;
    references: string;
    education: string;
    languages: string;
  };
};

// The generated CV document's own text — its locale is CvSettings.locale /
// CvSnapshot.locale, independent of whatever locale the admin happens to be browsing
// in (see docs/arch/11-i18n.md and lib/cv.ts).
export const en: CvDictionary = {
  screenHeader: { untitled: "Untitled", cvExport: "/ CV export", backToBuilder: "BACK TO BUILDER" },
  frozenBadge: "Frozen snapshot",
  sections: {
    summary: "Professional Summary",
    skills: "Technical Skills",
    experience: "Work Experience",
    projects: "Selected Projects",
    references: "References",
    education: "Education",
    languages: "Languages",
  },
};
