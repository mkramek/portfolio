"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type FieldSpec, fromRaw, setPath, toRaw } from "@/lib/admin/fields";
import type { LocaleCode } from "@/lib/i18n/config";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { FieldControl } from "./field-control";

type Row = {
  entity: string;
  entityId: string;
  entityLabel: string;
  fields: FieldSpec[];
  base: Record<string, unknown>;
  current: Record<string, unknown>;
  completeness: { needed: number; filled: number };
};

export function TranslationsView({
  targetLocale,
  targetLocales,
  missingOnly,
  rows,
  dict: fullDict,
}: {
  targetLocale: LocaleCode;
  targetLocales: Array<{ code: LocaleCode; nativeName: string }>;
  missingOnly: boolean;
  rows: Row[];
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = fullDict.translations;

  function updateQuery(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mt-6 max-w-[860px]">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[11px] font-medium tracking-[.08em] text-dim">
          {dict.targetLocale}
          <select
            value={targetLocale}
            onChange={(e) => updateQuery({ locale: e.target.value })}
            className="border border-line bg-panel2 px-2 py-1.5 text-[12px] text-fg outline-none focus:border-ac"
          >
            {targetLocales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.nativeName} · {locale.code}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[11.5px] text-dim">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => updateQuery({ missing: e.target.checked ? "1" : "0" })}
          />
          {dict.missingOnly}
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 border border-dashed border-line px-3.5 py-5 text-[11.5px] text-dim">
          {dict.noRowsMissing}
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.map((row) => (
            <TranslationRow
              key={`${row.entity}-${row.entityId}`}
              row={row}
              locale={targetLocale}
              dict={fullDict}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TranslationRow({
  row,
  locale,
  dict: fullDict,
}: {
  row: Row;
  locale: LocaleCode;
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const dict = fullDict.translations;
  const [raw, setRaw] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const field of row.fields) result[field.key] = toRaw(field, row.current as never);
    return result;
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isComplete = row.completeness.filled >= row.completeness.needed;

  async function save() {
    const values: Record<string, unknown> = {};
    for (const field of row.fields) setPath(values, field.key, fromRaw(field, raw[field.key]));
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/translations/${row.entity}/${row.entityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, values }),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(fullDict.common.couldNotSave);
      return;
    }
    setMessage(dict.saved);
    router.refresh();
  }

  return (
    <section className="border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[10px] font-semibold tracking-[.1em] text-ac">
            {dict.entityNames[row.entity as keyof typeof dict.entityNames] ?? row.entity}
          </span>
          <span className="text-[12px] font-medium">{row.entityLabel}</span>
        </div>
        <span className="text-[10.5px] text-dim">
          {row.completeness.filled}/{row.completeness.needed}
          {isComplete ? ` · ${dict.complete}` : ""}
        </span>
      </div>
      <div className="mt-3 grid gap-3">
        {row.fields.map((field) => (
          <div key={field.key} className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[10px] font-medium tracking-[.08em] text-dim">
                {field.label} — {dict.sourceColumn}
              </div>
              <div className="min-h-[36px] whitespace-pre-wrap rounded-[3px] border border-line bg-panel2 px-2.5 py-2 text-[12px] leading-[1.5] text-dim">
                {toRaw(field, row.base as never) || "—"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-medium tracking-[.08em] text-dim">
                {dict.targetColumn}
              </div>
              <FieldControl
                field={{ ...field, label: "" }}
                raw={raw[field.key] ?? ""}
                onRaw={(value) => setRaw((prev) => ({ ...prev, [field.key]: value }))}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button
          onClick={save}
          disabled={busy}
          className="px-3 py-1.5 text-[10.5px] font-semibold tracking-[.1em]"
        >
          {busy ? fullDict.common.saving : dict.save}
        </Button>
        {message && <span className="text-[11px] text-dim">{message}</span>}
      </div>
    </section>
  );
}
