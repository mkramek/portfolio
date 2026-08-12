import type { TestimonialRow } from "@/lib/content";
import { SectionHeader } from "./section-header";

export function Testimonials({
  num,
  label,
  testimonials,
}: {
  num: string;
  label: string;
  testimonials: TestimonialRow[];
}) {
  return (
    <div>
      <SectionHeader num={num} label={label} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
        {testimonials.map((q) => (
          <div key={q.id} className="rounded-[4px] border border-line bg-panel p-[22px_20px]">
            <p className="m-0 font-sans text-[14.5px] leading-[1.65] text-pretty">{q.quote}</p>
            <div className="mt-[16px] font-mono text-[11.5px] font-medium leading-[1.5]">
              {q.author}
            </div>
            <div className="font-mono text-[11px] leading-[1.5] text-dim">{q.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
