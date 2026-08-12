import type { ProjectRow } from "@/lib/content";
import { SectionHeader } from "./section-header";

export function Projects({
  num,
  label,
  variant,
  projects,
}: {
  num: string;
  label: string;
  variant: "index" | "window" | "plain";
  projects: ProjectRow[];
}) {
  return (
    <div>
      <SectionHeader num={num} label={label} />
      {variant === "index" && <ProjectsIndex projects={projects} />}
      {variant === "window" && <ProjectsWindow projects={projects} />}
      {variant === "plain" && <ProjectsPlain projects={projects} />}
    </div>
  );
}

function ProjectsIndex({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="border-t border-line">
      {projects.map((p, i) => (
        <div
          key={p.id}
          className="grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.5fr)_auto] items-baseline gap-[20px] border-b border-line p-[20px_10px] transition-colors duration-150 hover:bg-acsoft"
        >
          <span className="font-mono text-[11px] font-medium leading-none text-ac">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="font-mono text-[15px] font-semibold leading-[1.25] tracking-[-.02em]">
              {p.name}
            </div>
            <div className="mt-[5px] font-mono text-[11px] leading-[1.4] text-dim">
              {p.role} · {p.year}
            </div>
          </div>
          <p className="m-0 font-sans text-[13.5px] leading-[1.6] text-dim text-pretty">
            {p.blurb}
          </p>
          <span className="max-w-[180px] text-right font-mono text-[10.5px] leading-[1.5] text-dim">
            {p.stack.join(" · ")}
          </span>
        </div>
      ))}
    </div>
  );
}

function slug(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
}

function ProjectsWindow({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-[18px]">
      {projects.map((p) => (
        <div
          key={p.id}
          className="overflow-hidden rounded-[5px] border border-line bg-panel transition-colors duration-200 hover:border-ac"
        >
          <div className="flex items-center gap-[7px] border-b border-line bg-panel2 p-[8px_12px]">
            <span className="h-[8px] w-[8px] rounded-full bg-line" />
            <span className="h-[8px] w-[8px] rounded-full bg-line" />
            <span className="h-[8px] w-[8px] rounded-full bg-ac" />
            <span className="ml-[5px] font-mono text-[10.5px] leading-none text-dim">
              {slug(p.name)}
            </span>
          </div>
          <div className="p-[20px_18px_22px]">
            <h3 className="m-0 font-mono text-[16px] font-semibold leading-[1.25] tracking-[-.025em]">
              {p.name}
            </h3>
            <div className="mt-[6px] font-mono text-[11px] leading-[1.4] text-dim">
              {p.role} · {p.year}
            </div>
            <p className="mt-[13px] font-sans text-[13.5px] leading-[1.62] text-dim text-pretty">
              {p.blurb}
            </p>
            <div className="mt-[15px] flex flex-wrap gap-[5px]">
              {p.stack.map((t) => (
                <span
                  key={t}
                  className="rounded-[2px] border border-line p-[4px_7px] font-mono text-[10px] leading-none text-dim"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsPlain({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="grid gap-px border border-line bg-line">
      {projects.map((p) => (
        <div
          key={p.id}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-[28px] bg-bg p-[26px_24px]"
        >
          <div>
            <h3 className="m-0 font-mono text-[clamp(18px,2.3vw,26px)] font-semibold leading-[1.15] tracking-[-.03em]">
              {p.name}
            </h3>
            <div className="mt-[9px] font-mono text-[11px] leading-[1.5] tracking-[.06em] text-ac">
              {p.role} · {p.year}
            </div>
          </div>
          <div>
            <p className="m-0 font-sans text-[14.5px] leading-[1.65] text-pretty">{p.blurb}</p>
            <div className="mt-[14px] font-mono text-[11px] leading-[1.6] text-dim">
              {p.stack.join(" · ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
