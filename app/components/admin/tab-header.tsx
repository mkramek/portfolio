import type { ReactNode } from "react";

export function TabHeader({
  title,
  help,
  action,
}: {
  title: string;
  help?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-3.5">
      <h2 className="m-0 text-[18px] font-semibold leading-none tracking-[-.02em]">{title}</h2>
      {help && <span className="font-sans text-[12px] leading-[1.5] text-dim">{help}</span>}
      <div className="flex-1" />
      {action}
    </div>
  );
}
