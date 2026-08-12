import type { StrengthRow } from "@/lib/content";
import { SectionHeader } from "./section-header";

export function Strengths({
  num,
  label,
  strengths,
}: {
  num: string;
  label: string;
  strengths: StrengthRow[];
}) {
  return (
    <div>
      <SectionHeader num={num} label={label} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        {strengths.map((k) => (
          <div
            key={k.id}
            className="rounded-[4px] border border-line bg-panel p-[22px_20px_24px] transition-colors duration-200 hover:border-ac"
          >
            <div className="font-mono text-[11px] font-semibold tracking-[.1em] text-ac">
              {k.tag}
            </div>
            <h3 className="mt-[14px] font-mono text-[17px] font-semibold leading-[1.25] tracking-[-.02em]">
              {k.title}
            </h3>
            <p className="mt-[11px] font-sans text-[13.5px] leading-[1.65] text-dim text-pretty">
              {k.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
