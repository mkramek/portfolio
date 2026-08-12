"use client";

import { Tabs } from "@base-ui/react/tabs";
import { usePathname, useRouter } from "next/navigation";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";

type NavKey = keyof AdminDictionary["nav"];

const NAV_ITEMS: Array<{ path: string; navKey: NavKey; countKey: keyof Counts | null }> = [
  { path: "/admin/setup", navKey: "setup", countKey: null },
  { path: "/admin/experience", navKey: "experience", countKey: "roles" },
  { path: "/admin/projects", navKey: "projects", countKey: "projects" },
  { path: "/admin/skills", navKey: "skills", countKey: "skillGroups" },
  { path: "/admin/strengths", navKey: "strengths", countKey: "strengths" },
  { path: "/admin/references", navKey: "references", countKey: "testimonials" },
  { path: "/admin/profile", navKey: "profile", countKey: null },
  { path: "/admin/sections", navKey: "sections", countKey: null },
  { path: "/admin/appearance", navKey: "appearance", countKey: null },
  { path: "/admin/locales", navKey: "locales", countKey: null },
  { path: "/admin/translations", navKey: "translations", countKey: null },
  { path: "/admin/data", navKey: "data", countKey: null },
  { path: "/admin/cv", navKey: "cv", countKey: "cvSnapshots" },
];

type Counts = {
  roles: number;
  projects: number;
  skillGroups: number;
  strengths: number;
  testimonials: number;
  cvSnapshots: number;
};

export function AdminNav({
  counts,
  locale,
  dict,
}: {
  counts: Counts;
  locale: string;
  dict: AdminDictionary["nav"];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const root = `/${locale}/admin`;
  const active = pathname === root ? `${root}/experience` : pathname;

  return (
    <Tabs.Root
      value={active}
      onValueChange={(value) => {
        if (value) router.push(value);
      }}
    >
      <Tabs.List className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <Tabs.Tab
            key={item.path}
            value={`/${locale}${item.path}`}
            className="flex items-center justify-between gap-2 rounded-[3px] px-2.5 py-2 text-left text-[11.5px] font-medium tracking-[.04em] text-dim outline-none hover:text-fg focus-visible:ring-1 focus-visible:ring-ac data-active:bg-ac data-active:text-acfg"
          >
            <span>{dict[item.navKey]}</span>
            {item.countKey && <span className="opacity-60">{counts[item.countKey] ?? 0}</span>}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
