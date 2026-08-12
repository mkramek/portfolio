"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import type { Section } from "@/lib/schemas/section";

export function SectionsView({
  sections,
  dict,
}: {
  sections: Section[];
  dict: AdminDictionary["sectionsView"];
}) {
  const router = useRouter();

  async function move(id: string, dir: -1 | 1) {
    const res = await fetch("/api/admin/sections/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dir }),
    });
    if (res.ok) router.refresh();
  }

  async function toggle(section: Section) {
    const res = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...section, visible: !section.visible }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-6 max-w-[640px] overflow-hidden border border-line">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3.5 py-3 last:border-b-0"
        >
          <span className="text-[10.5px] text-dim">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium leading-[1.3]">{section.label}</div>
            <div className="mt-0.5 text-[10.5px] leading-[1.4] text-dim">{section.id}</div>
          </div>
          <span className="flex gap-1.5">
            <Button
              variant="toggle"
              active={section.visible}
              onClick={() => toggle(section)}
              className="h-[26px] px-2.5 text-[10px] font-medium tracking-[.08em]"
            >
              {section.visible ? dict.visible : dict.hidden}
            </Button>
            <Button
              variant="secondary"
              title="Move up"
              onClick={() => move(section.id, -1)}
              className="size-[26px] text-[10px]"
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              title="Move down"
              onClick={() => move(section.id, 1)}
              className="size-[26px] text-[10px]"
            >
              ↓
            </Button>
          </span>
        </div>
      ))}
    </div>
  );
}
