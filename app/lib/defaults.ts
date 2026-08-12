import { DEFAULT_LOCALE } from "./i18n/config";
import type { CvSettings } from "./schemas/cv-settings";
import type { Section } from "./schemas/section";
import type { Theme } from "./schemas/theme";

export const APP_DEFAULTS = {
  theme: {
    mode: "light",
    accent: "teal",
    hero: "monolith",
    timeline: "rail",
    project: "index",
    admin: "split",
  },
  cv: {
    company: "",
    position: "",
    summary: "",
    includeSkills: true,
    includeProjects: true,
    includeTestimonials: false,
    includeEducation: true,
    includeLanguages: true,
    locale: DEFAULT_LOCALE,
  },
} satisfies {
  theme: Theme;
  cv: CvSettings;
};

export const DEFAULT_SECTIONS: Section[] = [
  { id: "hero", label: "Intro", visible: true, sortOrder: 0 },
  { id: "strengths", label: "Strengths", visible: true, sortOrder: 1 },
  { id: "experience", label: "Experience", visible: true, sortOrder: 2 },
  { id: "projects", label: "Selected Work", visible: true, sortOrder: 3 },
  { id: "skills", label: "Stack", visible: true, sortOrder: 4 },
  { id: "testimonials", label: "References", visible: false, sortOrder: 5 },
  { id: "contact", label: "Contact", visible: true, sortOrder: 6 },
];

export const SINGLETON_ID = "singleton";
