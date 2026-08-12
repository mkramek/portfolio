import Link from "next/link";
import { ModeToggle } from "@/components/admin/mode-toggle";
import { cvContactLine, cvHeadline } from "@/lib/cv";
import type { CvDictionary } from "@/lib/i18n/dictionaries/en/cv";
import type { CvSettings } from "@/lib/schemas/cv-settings";
import type { CvSnapshotContent } from "@/lib/schemas/cv-snapshot";
import type { Profile } from "@/lib/schemas/profile";
import type { Theme } from "@/lib/schemas/theme";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MK";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleMeta(kind: string, location: string): string {
  return [...new Set([kind, location].filter(Boolean))].join(" · ");
}

function sectionHeading(title: string) {
  return (
    <h2 className="mb-[6pt] mt-[14pt] border-b-[0.5pt] border-[#999] pb-[3pt] text-[11pt] font-semibold leading-[1.2] uppercase tracking-[.1em]">
      {title}
    </h2>
  );
}

export function CvDocument({
  profile,
  cv,
  content,
  version,
  theme,
  locale,
  cvDict,
}: {
  profile: Profile;
  cv: CvSettings;
  content: CvSnapshotContent;
  version?: number;
  theme: Theme;
  /** Admin chrome locale — only used for the "back to builder" link, screen-only. */
  locale: string;
  /** The document's own content-language dictionary — see lib/cv.ts / CvSettings.locale. */
  cvDict: CvDictionary;
}) {
  const headline = cvHeadline(cv, profile);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-50 border-b border-line bg-bg print:hidden">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3.5 px-6 py-[11px]">
          <span className="grid size-[22px] shrink-0 place-items-center bg-fg text-[10px] font-bold leading-none tracking-[.02em] text-bg">
            {initialsOf(profile.name)}
          </span>
          <span className="whitespace-nowrap text-[12px] font-medium leading-none tracking-[.02em]">
            {profile.name || cvDict.screenHeader.untitled}
          </span>
          <span className="whitespace-nowrap text-[11px] leading-none text-dim">
            {cvDict.screenHeader.cvExport}
          </span>
          <div className="flex-1" />
          <Link
            href={`/${locale}/admin/cv`}
            className="border-0 text-[10.5px] font-medium tracking-[.1em] text-dim hover:text-fg"
          >
            {cvDict.screenHeader.backToBuilder}
          </Link>
          <ModeToggle mode={theme.mode} />
        </div>
      </header>

      <div className="cv-sheet font-sans">
        {version !== undefined && (
          <div className="mb-[10pt] flex items-center justify-between border border-[#999] px-[6pt] py-[3pt] font-mono text-[9pt] tracking-[.1em] text-[#555] uppercase print:hidden">
            <span>{cvDict.frozenBadge}</span>
            <span>v{version}</span>
          </div>
        )}

        <div className="border-b-[1.5pt] border-black pb-[10pt]">
          <h1 className="m-0 text-[22pt] font-semibold leading-[1.1] tracking-[-.01em]">
            {profile.name}
          </h1>
          <div className="mt-[5pt] text-[12pt] font-medium leading-[1.3]">{headline}</div>
          <div className="mt-[7pt] text-[10pt] leading-[1.5] text-[#222]">
            {cvContactLine(profile)}
          </div>
        </div>

        <h2 className="mb-[6pt] mt-[16pt] border-b-[0.5pt] border-[#999] pb-[3pt] text-[11pt] font-semibold leading-[1.2] uppercase tracking-[.1em]">
          {cvDict.sections.summary}
        </h2>
        <p className="m-0 text-[10.5pt] leading-[1.5] [text-wrap:pretty]">{content.summary}</p>

        {content.skills !== undefined && content.skills.length > 0 && (
          <section>
            {sectionHeading(cvDict.sections.skills)}
            {content.skills.map((group, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: array order is stable within a group
                key={`${group.group}-${index}`}
                className="cv-entry grid grid-cols-[100pt_1fr] gap-[10pt] py-[2.5pt]"
              >
                <span className="text-[10pt] font-semibold leading-[1.45]">{group.group}</span>
                <span className="text-[10pt] leading-[1.45]">{group.items.join(", ")}</span>
              </div>
            ))}
          </section>
        )}

        {(content.roles ?? []).length > 0 && (
          <section>
            {sectionHeading(cvDict.sections.experience)}
            {(content.roles ?? []).map((role, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: array order is stable within a role
                key={`${role.company}-${index}`}
                className="cv-entry mb-[11pt]"
              >
                <div className="flex items-baseline justify-between gap-[12pt]">
                  <span className="text-[10.5pt] font-semibold leading-[1.35]">
                    {role.title} · {role.company}
                  </span>
                  <span className="whitespace-nowrap text-[9.5pt] leading-[1.35] text-[#333]">
                    {role.start} – {role.end}
                  </span>
                </div>
                <div className="mt-[1.5pt] text-[9.5pt] leading-[1.4] text-[#444]">
                  {roleMeta(role.kind, role.location)}
                </div>
                <ul className="m-0 mt-[4pt] list-disc pl-[12pt]">
                  {role.bullets.map((bullet, bulletIndex) => (
                    <li
                      // biome-ignore lint/suspicious/noArrayIndexKey: array order is stable within a bullet list
                      key={`${role.company}-${bulletIndex}`}
                      className="mb-[1.5pt] text-[10pt] leading-[1.45] [text-wrap:pretty]"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {content.projects !== undefined && content.projects.length > 0 && (
          <section>
            {sectionHeading(cvDict.sections.projects)}
            {content.projects.map((project, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: array order is stable within a project
                key={`${project.name}-${index}`}
                className="cv-entry mb-[8pt]"
              >
                <div className="text-[10.5pt] font-semibold leading-[1.35]">
                  {project.name}{" "}
                  <span className="font-normal text-[#333]">
                    — {project.role}, {project.year}
                  </span>
                </div>
                <div className="mt-[2pt] text-[10pt] leading-[1.45] [text-wrap:pretty]">
                  {project.blurb}
                </div>
                <div className="mt-[1.5pt] text-[9.5pt] leading-[1.4] text-[#444]">
                  {project.stack.join(" · ")}
                </div>
              </div>
            ))}
          </section>
        )}

        {content.testimonials !== undefined && content.testimonials.length > 0 && (
          <section>
            {sectionHeading(cvDict.sections.references)}
            {content.testimonials.map((testimonial, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: array order is stable within a testimonial
                key={`${testimonial.author}-${index}`}
                className="cv-entry mb-[7pt] text-[10pt] leading-[1.45]"
              >
                “{testimonial.quote}”{" "}
                <span className="text-[#333]">
                  — {testimonial.author}, {testimonial.role}
                </span>
              </div>
            ))}
          </section>
        )}

        {content.education !== undefined && (
          <section>
            {sectionHeading(cvDict.sections.education)}
            <div className="text-[10.5pt] font-semibold leading-[1.4]">
              {content.education.degree}
            </div>
            <div className="text-[10pt] leading-[1.45] text-[#333]">{content.education.detail}</div>
          </section>
        )}

        {content.languages !== undefined && content.languages.length > 0 && (
          <section>
            {sectionHeading(cvDict.sections.languages)}
            <div className="text-[10pt] leading-[1.5]">
              {content.languages
                .map((language) => `${language.name} — ${language.level}`)
                .join("  ·  ")}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
