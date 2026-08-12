import type { ReactNode } from "react";

export function SectionHeader({
  num,
  label,
  end,
  className = "mb-[28px]",
}: {
  num: string;
  label: string;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-[13px] ${className}`}>
      <span className="font-mono text-[11px] font-semibold leading-none tracking-[.14em] text-ac">
        {num}
      </span>
      <h2 className="m-0 font-mono text-[12.5px] font-semibold uppercase leading-none tracking-[.18em]">
        {label}
      </h2>
      <div className="h-px flex-1 bg-line" />
      {end}
    </div>
  );
}
