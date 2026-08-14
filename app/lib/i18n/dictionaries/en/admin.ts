type FieldOverride = {
  label: string;
  hint?: string;
  boolLabel?: string;
  options?: Record<string, string>;
};
type ThemeAxisOptions<K extends string> = {
  label: string;
  options: Record<K, { label: string; help: string }>;
};

// Explicit interface, rather than deriving from `typeof en` with `as const` — see
// lib/i18n/dictionaries/en/public.ts for why. Every other locale's admin.ts is typed
// `satisfies AdminDictionary` (see ../../dictionaries.ts) so a missing key fails the
// build. The one deliberate exception is `fields`, typed as an open `Record<string, …>`
// — see lib/admin/fields.ts's `localizeFieldSpecs()` for how a field with no matching
// key there just falls back to its English default, which keeps it additive rather
// than a second source of truth that must stay in exact sync with every field.
export type AdminDictionary = {
  common: {
    save: string;
    saveEntry: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    moveUp: string;
    moveDown: string;
    actions: string;
    newEntry: string;
    includeInCv: string;
    destructiveDelete: string;
    yesDelete: string;
    couldNotSave: string;
    /** Template — {label} placeholder, see lib/i18n/format.ts's formatTemplate(). */
    noEntriesYet: string;
    /** Template — {label} placeholder. */
    deleteEntryTitle: string;
    deleteEntryBody: string;
  };
  shell: {
    contentAdmin: string;
    content: string;
    storedNote: string;
    signOut: string;
    untitled: string;
  };
  nav: {
    setup: string;
    experience: string;
    projects: string;
    skills: string;
    strengths: string;
    references: string;
    profile: string;
    sections: string;
    appearance: string;
    locales: string;
    translations: string;
    data: string;
    cv: string;
  };
  pages: Record<
    "profile" | "sections" | "appearance" | "data" | "cv" | "setup" | "locales" | "translations",
    { title: string; help: string }
  >;
  lists: Record<
    "roles" | "projects" | "skills" | "strengths" | "testimonials",
    { title: string; help: string; columns: string[] }
  >;
  fields: Record<string, FieldOverride>;
  appearance: {
    sections: Record<"appearance" | "layout", { title: string; help: string }>;
    axes: {
      mode: ThemeAxisOptions<"light" | "dark">;
      accent: ThemeAxisOptions<"teal" | "amber" | "lime" | "violet">;
      hero: ThemeAxisOptions<"monolith" | "terminal" | "ledger">;
      timeline: ThemeAxisOptions<"rail" | "ledger" | "cards">;
      project: ThemeAxisOptions<"index" | "window" | "plain">;
      admin: ThemeAxisOptions<"split" | "stacked">;
    };
    restoreDefault: string;
    restoreNote: string;
  };
  cvBuilder: {
    heading: string;
    blurb: string;
    downloadPdf: string;
    generatingPdf: string;
    openPrintPreview: string;
    pdfFailed: string;
    targetRole: string;
    positionPlaceholder: string;
    companyPlaceholder: string;
    tailoredSummary: string;
    summaryPlaceholder: string;
    resetToProfileSummary: string;
    sections: string;
    sectionToggles: Record<
      | "includeSkills"
      | "includeProjects"
      | "includeTestimonials"
      | "includeEducation"
      | "includeLanguages",
      string
    >;
    rolesIncludeOrder: string;
    noRoles: string;
    projectsInCv: string;
    noProjects: string;
    printAndDownload: string;
    downloadBlurb: string;
    orderBlurb: string;
    contentLanguage: string;
  };
  cvHistory: {
    heading: string;
    blurb: string;
    empty: string;
    view: string;
    redownload: string;
    /** Template — {version} placeholder. */
    deleteTitle: string;
    deleteBody: string;
    untitledRole: string;
    untitledCompany: string;
  };
  dataPanel: {
    exportTitle: string;
    exportBlurb: string;
    exportButton: string;
    importTitle: string;
    importBlurb: string;
    applyImport: string;
    toastExported: string;
    toastImported: string;
    toastInvalidJson: string;
    toastExportFailed: string;
    toastImportFailed: string;
  };
  profilePanel: {
    profileTitle: string;
    profileBlurb: string;
    saveProfile: string;
    educationTitle: string;
    educationBlurb: string;
    saveEducation: string;
    saved: string;
  };
  sectionsView: { visible: string; hidden: string };
  entryEditor: { editPrefix: string; newPrefix: string };
  login: {
    eyebrow: string;
    title: string;
    email: string;
    emailPlaceholder: string;
    sendMagicLink: string;
    sendCode: string;
    signInWithPasskey: string;
    code: string;
    signIn: string;
    back: string;
    magicLinkSent: string;
    genericError: string;
    invalidCode: string;
    passkeyFailed: string;
  };
  setup: {
    stepProfile: string;
    stepExperience: string;
    stepSkills: string;
    completeTitle: string;
    completeBody: string;
    viewSite: string;
    profileStepTitle: string;
    profileStepBlurb: string;
    saveProfile: string;
    profileError: string;
    roleStepTitle: string;
    roleStepBlurb: string;
    saveRole: string;
    roleError: string;
    skillsStepTitle: string;
    skillsStepBlurb: string;
    saveSkills: string;
    skillsError: string;
    depthOptions: Record<"simple" | "extended" | "advanced", string>;
  };
  passkey: {
    title: string;
    blurb: string;
    register: string;
    /** Template — {name} placeholder. */
    registered: string;
    registeredFallback: string;
    failed: string;
    signOut: string;
  };
  locales: {
    enabled: string;
    disabled: string;
    defaultBadge: string;
    /** Template — {percent} placeholder. */
    completeness: string;
  };
  translations: {
    targetLocale: string;
    missingOnly: string;
    sourceColumn: string;
    targetColumn: string;
    save: string;
    saved: string;
    complete: string;
    noRowsMissing: string;
    entityNames: Record<
      | "profile"
      | "role"
      | "project"
      | "skillGroup"
      | "strength"
      | "testimonial"
      | "education"
      | "language"
      | "section"
      | "cvSettings",
      string
    >;
  };
};

export const en: AdminDictionary = {
  common: {
    save: "SAVE",
    saveEntry: "SAVE ENTRY",
    saving: "SAVING…",
    cancel: "CANCEL",
    delete: "DELETE",
    edit: "EDIT",
    moveUp: "Move up",
    moveDown: "Move down",
    actions: "ACTIONS",
    newEntry: "+ NEW ENTRY",
    includeInCv: "Include in CV",
    destructiveDelete: "DESTRUCTIVE · DELETE",
    yesDelete: "YES, DELETE",
    couldNotSave: "Could not save — check the fields and try again.",
    noEntriesYet: "No entries yet — add one with “{label}”.",
    deleteEntryTitle: "Delete “{label}”?",
    deleteEntryBody:
      "This removes the entry from the portfolio and from the CV export. It cannot be undone.",
  },
  shell: {
    contentAdmin: "/ content admin",
    content: "CONTENT",
    storedNote: "Stored in the database — visible immediately on the site.",
    signOut: "SIGN OUT",
    untitled: "Untitled",
  },
  nav: {
    setup: "Setup",
    experience: "Experience",
    projects: "Projects",
    skills: "Skills",
    strengths: "Strengths",
    references: "References",
    profile: "Profile",
    sections: "Sections",
    appearance: "Appearance",
    locales: "Locales",
    translations: "Translations",
    data: "Data",
    cv: "CV",
  },
  pages: {
    profile: { title: "Profile", help: "Name, contact, summary and availability." },
    sections: { title: "Sections", help: "Reorder and hide whole sections of the portfolio." },
    appearance: {
      title: "Appearance",
      help: "Every layout variant and colour setting, shared by all three screens.",
    },
    data: { title: "Data", help: "Everything is stored in the database. Export to keep a copy." },
    cv: {
      title: "CV",
      help: "Tailor a two-page A4 export per application, then download the PDF.",
    },
    setup: { title: "Setup", help: "Guided first-run content entry and passkeys." },
    locales: {
      title: "Locales",
      help: "Turn on the languages visitors can switch to. English can't be turned off.",
    },
    translations: {
      title: "Translations",
      help: "Fill in the missing text for a language — untranslated fields fall back to English.",
    },
  },
  lists: {
    roles: {
      title: "Experience",
      help: "Each role carries a detail level: simple, extended or advanced.",
      columns: ["PERIOD", "COMPANY", "ROLE", "DETAIL"],
    },
    projects: {
      title: "Projects",
      help: "Case-study entries shown under Selected Work.",
      columns: ["PROJECT", "CONTEXT", "PERIOD"],
    },
    skills: {
      title: "Skills",
      help: "Grouped rows — order here is order on the page and in the CV.",
      columns: ["GROUP", "SKILLS"],
    },
    strengths: {
      title: "Strengths",
      help: "The three cards under the intro.",
      columns: ["TAG", "TITLE", "BODY"],
    },
    testimonials: {
      title: "References",
      help: "Replace the placeholders with real quotes before publishing.",
      columns: ["AUTHOR", "ROLE", "QUOTE"],
    },
  },
  fields: {
    "role.company": { label: "COMPANY" },
    "role.title": { label: "ROLE TITLE" },
    "role.start": { label: "START", hint: "e.g. Oct 2024" },
    "role.end": { label: "END", hint: "e.g. Present" },
    "role.kind": { label: "ENGAGEMENT", hint: "e.g. Contract · Remote" },
    "role.location": { label: "LOCATION" },
    "role.depth": {
      label: "DETAIL LEVEL",
      hint: "simple = one-liner only · extended = metrics, bullets, stack · advanced = + case study",
      options: { simple: "SIMPLE", extended: "EXTENDED", advanced: "ADVANCED" },
    },
    "role.oneLiner": { label: "ONE-LINER" },
    "role.bullets": { label: "BULLETS", hint: "One per line" },
    "role.metrics": { label: "METRICS", hint: "One per line: value | label" },
    "role.stack": { label: "STACK", hint: "Comma separated" },
    "role.caseStudy.context": { label: "CASE — CONTEXT" },
    "role.caseStudy.approach": { label: "CASE — APPROACH" },
    "role.caseStudy.impact": { label: "CASE — IMPACT" },
    "role.includeInCv": { label: "CV", boolLabel: "Include in CV export" },
    "project.name": { label: "PROJECT" },
    "project.role": { label: "YOUR ROLE / CONTEXT" },
    "project.year": { label: "PERIOD" },
    "project.blurb": { label: "DESCRIPTION" },
    "project.stack": { label: "STACK", hint: "Comma separated" },
    "project.link": { label: "LINK", hint: "Optional" },
    "project.includeInCv": { label: "CV", boolLabel: "Include in CV export" },
    "skillGroup.group": { label: "GROUP" },
    "skillGroup.items": { label: "SKILLS", hint: "Comma separated" },
    "strength.tag": { label: "TAG" },
    "strength.title": { label: "TITLE" },
    "strength.body": { label: "BODY" },
    "testimonial.quote": { label: "QUOTE" },
    "testimonial.author": { label: "AUTHOR" },
    "testimonial.role": { label: "AUTHOR ROLE" },
    "testimonial.includeInCv": { label: "CV", boolLabel: "Include as reference in CV" },
    "profile.name": { label: "NAME" },
    "profile.handle": { label: "HANDLE", hint: "e.g. milosz" },
    "profile.title": { label: "TITLE" },
    "profile.tagline": { label: "TAGLINE" },
    "profile.availability": { label: "AVAILABILITY" },
    "profile.email": { label: "EMAIL" },
    "profile.phone": { label: "PHONE" },
    "profile.location": { label: "LOCATION" },
    "profile.linkedin": { label: "LINKEDIN" },
    "profile.github": { label: "GITHUB" },
    "profile.summary": { label: "CV SUMMARY" },
    "profile.heroStats": { label: "STAT STRIP", hint: "One per line: value | label" },
    "profile.ledgerRows": { label: "DATA SHEET", hint: "One per line: label | value" },
    "education.degree": { label: "DEGREE" },
    "education.detail": { label: "DETAIL" },
  },
  appearance: {
    sections: {
      appearance: {
        title: "APPEARANCE",
        help: "Colour and mode — applies to the portfolio, CV builder and this panel.",
      },
      layout: {
        title: "LAYOUT VARIANTS",
        help: "Swap how each part of the portfolio is laid out.",
      },
    },
    axes: {
      mode: {
        label: "MODE",
        options: {
          light: {
            label: "LIGHT",
            help: "Warm off-white paper, ink-black type — the default read.",
          },
          dark: { label: "DARK", help: "Terminal read: near-black ground with a luminous accent." },
        },
      },
      accent: {
        label: "ACCENT",
        options: {
          teal: { label: "TEAL", help: "Cool and technical; the default." },
          amber: { label: "AMBER", help: "Warmer, closer to an amber CRT." },
          lime: { label: "LIME", help: "Sharper, phosphor-green energy." },
          violet: { label: "VIOLET", help: "Quieter and more editorial." },
        },
      },
      hero: {
        label: "INTRO TREATMENT",
        options: {
          monolith: {
            label: "MONOLITH",
            help: "Oversized name, tagline and a four-cell stat strip.",
          },
          terminal: {
            label: "TERMINAL",
            help: "A shell window answering whoami, role, summary and status.",
          },
          ledger: {
            label: "DATA SHEET",
            help: "Two columns: short pitch beside a key/value spec table.",
          },
        },
      },
      timeline: {
        label: "EXPERIENCE LAYOUT",
        options: {
          rail: {
            label: "RAIL",
            help: "Vertical rail with dates on the left; full detail inline.",
          },
          ledger: {
            label: "LEDGER",
            help: "Dense clickable rows — detail expands only when opened.",
          },
          cards: {
            label: "CARDS",
            help: "Compact grid, scannable at a glance; less detail per role.",
          },
        },
      },
      project: {
        label: "PROJECT CARDS",
        options: {
          index: { label: "INDEX", help: "Numbered index rows with stack listed on the right." },
          window: { label: "WINDOW", help: "Terminal-window cards in a responsive grid." },
          plain: { label: "BLOCKS", help: "Full-width blocks with a large project title." },
        },
      },
      admin: {
        label: "ADMIN EDITOR",
        options: {
          split: { label: "SPLIT", help: "Entry editor opens beside the table." },
          stacked: { label: "STACKED", help: "Editor opens under the table at full width." },
        },
      },
    },
    restoreDefault: "RESTORE DEFAULT APPEARANCE",
    restoreNote: "Applies to all three screens — reload keeps it.",
  },
  cvBuilder: {
    heading: "CV BUILDER",
    blurb:
      "Tailor a two-page A4 export per application, then download the PDF. Every change here is immediately reflected in the portfolio too.",
    downloadPdf: "DOWNLOAD PDF",
    generatingPdf: "GENERATING PDF…",
    openPrintPreview: "OPEN PRINT PREVIEW",
    pdfFailed: "PDF generation failed — try again.",
    targetRole: "TARGET ROLE / COMPANY",
    positionPlaceholder: "e.g. Senior Platform Engineer",
    companyPlaceholder: "e.g. Acme",
    tailoredSummary: "TAILORED SUMMARY",
    summaryPlaceholder: "Falls back to your profile summary when empty.",
    resetToProfileSummary: "RESET TO PROFILE SUMMARY",
    sections: "SECTIONS",
    sectionToggles: {
      includeSkills: "Technical skills",
      includeProjects: "Selected projects",
      includeTestimonials: "References",
      includeEducation: "Education",
      includeLanguages: "Languages",
    },
    rolesIncludeOrder: "ROLES · INCLUDE & ORDER",
    noRoles: "No roles yet.",
    projectsInCv: "PROJECTS IN CV",
    noProjects: "No projects yet.",
    printAndDownload: "PRINT & DOWNLOAD",
    downloadBlurb:
      "“DOWNLOAD PDF” renders the same document the print preview shows, as a real file. Every download is frozen into the history list below — editing or deleting content afterwards never changes what a snapshot shows.",
    orderBlurb:
      "Reordering roles here also reorders the public portfolio — one shared order, by design.",
    contentLanguage: "CV LANGUAGE",
  },
  cvHistory: {
    heading: "SNAPSHOT HISTORY",
    blurb: "Every downloaded PDF, frozen as it was generated.",
    empty: "No snapshots yet — download a PDF and it lands here automatically.",
    view: "VIEW",
    redownload: "REDOWNLOAD",
    deleteTitle: "Delete snapshot v{version}?",
    deleteBody:
      "This removes the frozen copy of that CV. The remaining snapshots for this application renumber automatically.",
    untitledRole: "Untitled role",
    untitledCompany: "Untitled company",
  },
  dataPanel: {
    exportTitle: "EXPORT",
    exportBlurb: "Download every entry as JSON — a backup, or the seed file for a real backend.",
    exportButton: "DOWNLOAD portfolio.json",
    importTitle: "IMPORT",
    importBlurb: "Paste a previously exported JSON payload and replace the current content.",
    applyImport: "APPLY IMPORT",
    toastExported: "exported",
    toastImported: "imported",
    toastInvalidJson: "invalid JSON",
    toastExportFailed: "export failed",
    toastImportFailed: "import failed — payload rejected",
  },
  profilePanel: {
    profileTitle: "PROFILE",
    profileBlurb: "Name, contact, summary and availability — the essentials shown across the site.",
    saveProfile: "SAVE PROFILE",
    educationTitle: "EDUCATION",
    educationBlurb: "A single education entry, used by the CV export.",
    saveEducation: "SAVE EDUCATION",
    saved: "Saved.",
  },
  sectionsView: { visible: "VISIBLE", hidden: "HIDDEN" },
  entryEditor: { editPrefix: "EDIT", newPrefix: "NEW" },
  login: {
    eyebrow: "cv admin",
    title: "Sign in",
    email: "Email",
    emailPlaceholder: "you@example.com",
    sendMagicLink: "Send magic link",
    sendCode: "Send code",
    signInWithPasskey: "Sign in with a passkey",
    code: "Code",
    signIn: "Sign in",
    back: "Back",
    magicLinkSent: "If an account matches that email, we've sent a sign-in link. Check your inbox.",
    genericError: "Something went wrong.",
    invalidCode: "Invalid or expired code.",
    passkeyFailed: "Passkey sign-in failed.",
  },
  setup: {
    stepProfile: "1 Profile",
    stepExperience: "2 Experience",
    stepSkills: "3 Skills",
    completeTitle: "Setup complete",
    completeBody: "Your site is live.",
    viewSite: "View site",
    profileStepTitle: "Your name and contact",
    profileStepBlurb: "These essentials show on the site.",
    saveProfile: "Save profile",
    profileError: "Something went wrong saving your profile.",
    roleStepTitle: "One role to start",
    roleStepBlurb:
      "Your experience timeline needs at least one role. You can add the full detail later.",
    saveRole: "Save role",
    roleError: "Something went wrong saving your role.",
    skillsStepTitle: "One skill group",
    skillsStepBlurb: "The stack section needs at least one group. Add more detail later.",
    saveSkills: "Save skills",
    skillsError: "Something went wrong saving your skills.",
    depthOptions: {
      simple: "Simple — one-liner",
      extended: "Extended — metrics, bullets, stack",
      advanced: "Advanced — case study",
    },
  },
  passkey: {
    title: "Passkeys",
    blurb: "Register a passkey for this device so you can sign in without an email.",
    register: "Register a passkey for this device",
    registered: 'Registered passkey "{name}".',
    registeredFallback: "Passkey registered.",
    failed: "Passkey registration failed.",
    signOut: "Sign out",
  },
  locales: {
    enabled: "ENABLED",
    disabled: "DISABLED",
    defaultBadge: "DEFAULT — ALWAYS ON",
    completeness: "{percent}% translated",
  },
  translations: {
    targetLocale: "LANGUAGE",
    missingOnly: "Show missing only",
    sourceColumn: "ENGLISH (SOURCE)",
    targetColumn: "TRANSLATION",
    save: "SAVE TRANSLATION",
    saved: "Saved.",
    complete: "Fully translated.",
    noRowsMissing: "Nothing left to translate for this language.",
    entityNames: {
      profile: "Profile",
      role: "Experience",
      project: "Projects",
      skillGroup: "Skills",
      strength: "Strengths",
      testimonial: "References",
      education: "Education",
      language: "Languages",
      section: "Sections",
      cvSettings: "CV",
    },
  },
};
