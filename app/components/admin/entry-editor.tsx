"use client";

import { Button } from "@/components/ui/button";
import type { FieldSpec } from "@/lib/admin/fields";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { FieldControl } from "./field-control";

export function EntryEditor({
  title,
  fields,
  raw,
  onRaw,
  onSave,
  onCancel,
  busy,
  dict,
}: {
  title: string;
  fields: FieldSpec[];
  raw: Record<string, string>;
  onRaw: (key: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  dict: AdminDictionary["common"];
}) {
  return (
    <div>
      <div className="sticky top-0 flex items-baseline justify-between gap-2.5 border-b border-line bg-panel2 px-4 py-3.5">
        <span className="text-[11px] font-semibold tracking-[.1em]">{title}</span>
        <Button
          variant="ghost"
          onClick={onCancel}
          aria-label="Close editor"
          className="text-[15px] leading-none"
        >
          ×
        </Button>
      </div>
      <div className="grid gap-3 p-4">
        {fields.map((field) => (
          <FieldControl
            key={field.key}
            field={field}
            raw={raw[field.key] ?? ""}
            onRaw={(value) => onRaw(field.key, value)}
          />
        ))}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={onSave}
            disabled={busy}
            className="flex-1 px-3 py-2.5 text-[10.5px] font-semibold tracking-[.1em]"
          >
            {busy ? dict.saving : dict.saveEntry}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            className="px-3.5 py-2.5 text-[10.5px] font-medium tracking-[.1em]"
          >
            {dict.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
