"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { APP_DEFAULTS } from "@/lib/defaults";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import type { Theme } from "@/lib/schemas/theme";

const THEME_SECTION_KEYS: Array<{ section: "appearance" | "layout"; keys: (keyof Theme)[] }> = [
  { section: "appearance", keys: ["mode", "accent"] },
  { section: "layout", keys: ["hero", "timeline", "project", "admin"] },
];

export function AppearanceView({ theme, dict }: { theme: Theme; dict: AdminDictionary }) {
  const router = useRouter();
  const appearance = dict.appearance;

  async function setAxis(key: keyof Theme, value: string) {
    const res = await fetch("/api/admin/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) router.refresh();
  }

  async function reset() {
    const res = await fetch("/api/admin/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(APP_DEFAULTS.theme),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-6 grid max-w-[820px] gap-5">
      {THEME_SECTION_KEYS.map(({ section, keys }) => {
        const sectionDict = appearance.sections[section];
        return (
          <section key={section}>
            <div className="mb-3 flex items-baseline gap-3">
              <span className="text-[10.5px] font-semibold tracking-[.14em] text-ac">
                {sectionDict.title}
              </span>
              <span className="font-sans text-[11.5px] leading-[1.4] text-dim">
                {sectionDict.help}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="overflow-hidden border border-line">
              {keys.map((key) => {
                const axis = appearance.axes[key];
                const current = theme[key];
                const options = axis.options as Record<string, { label: string; help: string }>;
                const hit = options[current] ?? Object.values(options)[0];
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[200px_minmax(0,1fr)] items-start gap-5 border-b border-line bg-panel p-4 last:border-b-0"
                  >
                    <div>
                      <div className="text-[11px] font-semibold tracking-[.08em]">{axis.label}</div>
                      <div className="mt-1.5 text-[10.5px] text-ac">= {hit.label}</div>
                    </div>
                    <div>
                      <ToggleGroup
                        value={[current]}
                        onValueChange={(values) => {
                          const next = values[0];
                          if (next && next !== current) setAxis(key, next);
                        }}
                        className="flex flex-wrap gap-1.5"
                      >
                        {Object.entries(options).map(([value, option]) => (
                          <Toggle
                            key={value}
                            value={value}
                            className="border border-line bg-transparent px-3 py-2 text-[11px] font-medium tracking-[.06em] text-dim outline-none hover:border-fg hover:text-fg data-pressed:border-ac data-pressed:bg-ac data-pressed:text-acfg"
                          >
                            {option.label}
                          </Toggle>
                        ))}
                      </ToggleGroup>
                      <p className="mt-2 text-[11.5px] leading-[1.5] text-dim">{hit.help}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <div className="flex items-center gap-2.5">
        <Button
          variant="secondary"
          onClick={reset}
          className="px-3 py-2.5 text-[10.5px] font-medium tracking-[.1em]"
        >
          {appearance.restoreDefault}
        </Button>
        <span className="text-[11px] text-dim">{appearance.restoreNote}</span>
      </div>
    </div>
  );
}
