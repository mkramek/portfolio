"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { LocaleCode } from "@/lib/i18n/config";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { formatTemplate } from "@/lib/i18n/format";

type LocaleRow = {
  code: LocaleCode;
  enabled: boolean;
  englishName: string;
  nativeName: string;
  percent: number;
};

export function LocalesView({
  rows,
  dict,
}: {
  rows: LocaleRow[];
  dict: AdminDictionary["locales"];
}) {
  const router = useRouter();

  async function toggle(row: LocaleRow) {
    const res = await fetch("/api/admin/locales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: row.code, enabled: !row.enabled }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-6 max-w-[640px] overflow-hidden border border-line">
      {rows.map((row) => {
        const isDefault = row.code === "en";
        return (
          <div
            key={row.code}
            className="grid grid-cols-[minmax(0,1fr)_100px_auto] items-center gap-3 border-b border-line px-3.5 py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-medium leading-[1.3]">
                {row.nativeName}
                <span className="ml-1.5 text-[10.5px] font-normal text-dim">
                  {row.englishName} · {row.code}
                </span>
              </div>
              <div className="mt-0.5 text-[10.5px] leading-[1.4] text-dim">
                {formatTemplate(dict.completeness, { percent: row.percent })}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full bg-ac"
                style={{ width: `${row.percent}%` }}
                aria-hidden="true"
              />
            </div>
            {isDefault ? (
              <span className="h-[26px] border border-ac bg-ac px-2.5 text-[10px] font-medium leading-[26px] tracking-[.08em] text-acfg">
                {dict.defaultBadge}
              </span>
            ) : (
              <Button
                variant="toggle"
                active={row.enabled}
                onClick={() => toggle(row)}
                className="h-[26px] px-2.5 text-[10px] font-medium tracking-[.08em]"
              >
                {row.enabled ? dict.enabled : dict.disabled}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
