import Link from "next/link";
import { lang } from "next/root-params";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ModeToggle } from "@/components/admin/mode-toggle";
import { SignOutButton } from "@/components/admin/sign-out";
import { getProfile, getTheme } from "@/lib/content";
import { prisma } from "@/lib/db";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

function initialsOf(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AdminShellLayout({ children }: { children: ReactNode }) {
  const [locale, profile, theme, dict, counts] = await Promise.all([
    lang(),
    getProfile(),
    getTheme(),
    getAdminDictionary(),
    (async () => {
      const [roles, projects, skillGroups, strengths, testimonials, cvSnapshots] =
        await Promise.all([
          prisma.role.count(),
          prisma.project.count(),
          prisma.skillGroup.count(),
          prisma.strength.count(),
          prisma.testimonial.count(),
          prisma.cvSnapshot.count(),
        ]);
      return { roles, projects, skillGroups, strengths, testimonials, cvSnapshots };
    })(),
  ]);

  return (
    <div className="min-h-screen bg-bg font-mono text-fg">
      <header className="sticky top-0 z-50 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3.5 px-6 py-[11px]">
          <span className="grid size-[22px] shrink-0 place-items-center bg-fg text-[10px] font-bold leading-none tracking-[.02em] text-bg">
            {initialsOf(profile.name, "?")}
          </span>
          <span className="whitespace-nowrap text-[12px] font-medium leading-none tracking-[.02em]">
            {profile.name || dict.shell.untitled}
          </span>
          <span className="whitespace-nowrap text-[11px] leading-none text-dim">
            {dict.shell.contentAdmin}
          </span>
          <div className="flex-1" />
          <nav className="flex gap-0.5 border border-line p-0.5">
            <Link
              href={`/${locale}`}
              className="border-0 px-2.5 py-1.5 text-[10.5px] font-medium tracking-[.1em] text-dim hover:text-fg"
            >
              {dict.shell.portfolio}
            </Link>
            <Link
              href={`/${locale}/admin/cv`}
              className="border-0 px-2.5 py-1.5 text-[10.5px] font-medium tracking-[.1em] text-dim hover:text-fg"
            >
              {dict.shell.cv}
            </Link>
            <Link
              href={`/${locale}/admin`}
              className="border-0 bg-ac px-2.5 py-1.5 text-[10.5px] font-medium tracking-[.1em] text-acfg"
            >
              {dict.shell.admin}
            </Link>
          </nav>
          <ModeToggle mode={theme.mode} />
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] grid-cols-[196px_minmax(0,1fr)] items-start">
        <aside className="sticky top-[47px] min-h-[calc(100vh-47px)] border-r border-line px-3 pb-10 pt-5">
          <div className="px-2 pb-3 text-[10.5px] font-semibold tracking-[.14em] text-dim">
            {dict.shell.content}
          </div>
          <AdminNav counts={counts} locale={locale} dict={dict.nav} />
          <div className="mt-5 px-2 pt-4">
            <div className="mb-3 text-[10.5px] leading-relaxed text-dim">
              {dict.shell.storedNote}
            </div>
            <SignOutButton locale={locale} label={dict.shell.signOut} />
          </div>
        </aside>
        <main className="min-w-0 px-[26px] pb-20 pt-6">{children}</main>
      </div>
    </div>
  );
}
