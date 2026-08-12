import type { SkillGroupRow } from "@/lib/content";
import { SectionHeader } from "./section-header";

export function Skills({
  num,
  label,
  groups,
}: {
  num: string;
  label: string;
  groups: SkillGroupRow[];
}) {
  return (
    <div>
      <SectionHeader num={num} label={label} />
      <div className="border-t border-line">
        {groups.map((g) => (
          <div
            key={g.id}
            className="grid grid-cols-[170px_minmax(0,1fr)] items-start gap-[20px] border-b border-line p-[15px_0]"
          >
            <span className="font-mono text-[11px] leading-[1.6] tracking-[.08em] text-dim">
              {g.group}
            </span>
            <div className="flex flex-wrap gap-[6px]">
              {g.items.map((t) => (
                <span
                  key={t}
                  className="rounded-[2px] border border-line bg-panel p-[6px_9px] font-mono text-[11.5px] font-medium leading-none transition-colors hover:border-ac hover:text-ac"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
