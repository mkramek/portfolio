import { getEnabledLocales } from "@/lib/content";
import type { LocaleCode } from "@/lib/i18n/config";
import { LOCALE_CATALOGUE } from "@/lib/i18n/config";
import { getLocalizedContent } from "@/lib/i18n/content";
import { getPublicDictionary } from "@/lib/i18n/dictionaries";
import { personJsonLd } from "@/lib/seo";
import { Contact } from "./portfolio/contact";
import { Experience } from "./portfolio/experience";
import { Hero } from "./portfolio/hero";
import { LanguageSwitcher } from "./portfolio/language-switcher";
import { Projects } from "./portfolio/projects";
import { Skills } from "./portfolio/skills";
import { Strengths } from "./portfolio/strengths";
import { Testimonials } from "./portfolio/testimonials";

export async function Portfolio({ locale }: { locale: LocaleCode }) {
  const [
    { theme, sections, profile, roles, strengths, projects, skillGroups, testimonials },
    dict,
    enabledLocales,
  ] = await Promise.all([getLocalizedContent(locale), getPublicDictionary(), getEnabledLocales()]);

  const visible = sections
    .filter((s) => s.visible)
    .map((s, i) => ({ ...s, num: String(i + 1).padStart(2, "0") }));

  const initials =
    profile.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "MK";

  const switcherLocales = enabledLocales.map((code) => ({
    code,
    nativeName: LOCALE_CATALOGUE.find((entry) => entry.code === code)?.nativeName ?? code,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script content, escaped per Next.js's own guide (see lib/seo.ts)
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd(profile, locale)).replace(/</g, "\\u003c"),
        }}
      />
      <header className="sticky top-0 z-[60] border-b border-line bg-bg">
        <div className="mx-auto flex max-w-[1440px] items-center gap-[14px] px-6 py-[11px]">
          <div className="flex min-w-0 items-center gap-[9px]">
            <span className="grid h-[22px] w-[22px] place-items-center bg-fg font-mono text-[10px] font-bold leading-none tracking-[.02em] text-bg">
              {initials}
            </span>
            <span className="whitespace-nowrap font-mono text-[12px] font-medium leading-none tracking-[.02em]">
              {profile.name}
            </span>
            <span className="whitespace-nowrap font-mono text-[11px] font-normal leading-none text-dim">
              / {profile.title}
            </span>
          </div>
          <div className="flex-1" />
          <LanguageSwitcher current={locale} locales={switcherLocales} />
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 pb-[120px]">
        {visible.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-[70px] pt-16">
            {s.id === "hero" && (
              <Hero theme={theme} profile={profile} roles={roles} dict={dict.hero} />
            )}
            {s.id === "strengths" && (
              <Strengths num={s.num} label={s.label} strengths={strengths} />
            )}
            {s.id === "experience" && (
              <Experience
                num={s.num}
                label={s.label}
                timeline={theme.timeline}
                roles={roles}
                locale={locale}
                dict={dict.experience}
              />
            )}
            {s.id === "projects" && (
              <Projects num={s.num} label={s.label} variant={theme.project} projects={projects} />
            )}
            {s.id === "skills" && <Skills num={s.num} label={s.label} groups={skillGroups} />}
            {s.id === "testimonials" && (
              <Testimonials num={s.num} label={s.label} testimonials={testimonials} />
            )}
            {s.id === "contact" && <Contact label={s.label} profile={profile} />}
          </section>
        ))}
      </main>
    </>
  );
}
