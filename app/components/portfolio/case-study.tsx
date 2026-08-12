"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "./types";

export function CaseStudy({
  caseRows,
  openLabel,
  closeLabel,
}: {
  caseRows: CaseRow[];
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  if (caseRows.length === 0) return null;

  return (
    <div className="mt-[18px]">
      <Button
        variant="accent-outline"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded-[3px] p-[7px_11px] font-mono text-[10.5px] font-medium leading-none tracking-[.1em] transition-colors"
      >
        {open ? closeLabel : openLabel}
      </Button>
      {open && (
        <div className="mt-[14px] grid gap-px overflow-hidden rounded-[4px] border border-line bg-line">
          {caseRows.map((c) => (
            <div key={c.label} className="bg-panel p-[16px_18px]">
              <div className="font-mono text-[10px] font-semibold leading-none tracking-[.14em] text-ac">
                {c.label}
              </div>
              <p className="mt-[9px] max-w-[74ch] font-sans text-[13.5px] leading-[1.65] text-fg text-pretty">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
