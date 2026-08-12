"use client";

import { useState } from "react";
import type { DerivedRole } from "./types";

export function LedgerRoleRow({
  role,
  openLabel,
  closeLabel,
}: {
  role: DerivedRole;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const toggleable = role.depth !== "simple";

  return (
    <div className="border-b border-line">
      <button
        type="button"
        disabled={!toggleable}
        onClick={toggleable ? () => setOpen((v) => !v) : undefined}
        className={`grid w-full grid-cols-[118px_minmax(0,1.1fr)_minmax(0,1.6fr)_70px] items-baseline gap-[20px] p-[16px_10px] text-left ${
          toggleable ? "cursor-pointer transition-colors duration-150 hover:bg-acsoft" : ""
        }`}
      >
        <span className="font-mono text-[11px] leading-[1.4] text-dim">{role.dates}</span>
        <span className="font-mono text-[14px] font-semibold leading-[1.35] tracking-[-.02em]">
          {role.company}
          <span className="block font-mono text-[11px] font-normal leading-[1.5] text-dim">
            {role.title}
          </span>
        </span>
        <span className="font-mono text-[13px] leading-[1.55] text-dim text-pretty">
          {role.oneLiner}
        </span>
        <span className="justify-self-end font-mono text-[9.5px] font-semibold leading-none tracking-[.1em] text-ac">
          {toggleable ? (open ? closeLabel : openLabel) : ""}
        </span>
      </button>
      {open && role.extended && (
        <div className="grid grid-cols-[118px_minmax(0,1fr)] gap-[20px] p-[2px_10px_24px]">
          <div />
          <div>
            <div className="flex flex-wrap gap-[24px]">
              {role.metrics.map((m) => (
                <div key={`${m.value}-${m.label}`}>
                  <div className="font-mono text-[15px] font-semibold leading-none text-ac">
                    {m.value}
                  </div>
                  <div className="mt-[5px] font-mono text-[10.5px] leading-[1.3] text-dim">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-[14px] grid list-none gap-[6px] p-0">
              {role.bullets.map((b) => (
                <li
                  key={b}
                  className="grid max-w-[74ch] grid-cols-[14px_1fr] gap-x-[8px] font-sans text-[13px] leading-[1.6] text-dim"
                >
                  <span className="text-ac">—</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {role.caseRows.length > 0 && (
              <div className="mt-[14px] grid gap-[12px]">
                {role.caseRows.map((c) => (
                  <div key={c.label} className="border-l-2 border-ac p-[2px_0_2px_14px]">
                    <div className="font-mono text-[10px] font-semibold leading-none tracking-[.14em] text-ac">
                      {c.label}
                    </div>
                    <p className="mt-[8px] max-w-[74ch] font-sans text-[13px] leading-[1.65] text-pretty">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-[16px] flex flex-wrap gap-[6px]">
              {role.stack.map((t) => (
                <span
                  key={t}
                  className="rounded-[2px] border border-line p-[5px_8px] font-mono text-[10.5px] leading-none text-dim"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
