"use client";

import { BoolInput, Field, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import type { FieldSpec } from "@/lib/admin/fields";

export function FieldControl({
  field,
  raw,
  onRaw,
}: {
  field: FieldSpec;
  raw: string;
  onRaw: (value: string) => void;
}) {
  const id = `field-${field.key}`;

  if (field.type === "bool") {
    return (
      <div>
        <label
          className="mb-1 block text-[10.5px] font-medium tracking-[.1em] text-dim"
          htmlFor={id}
        >
          {field.label}
        </label>
        <BoolInput
          id={id}
          checked={raw === "1"}
          onChange={(checked) => onRaw(checked ? "1" : "0")}
          label={field.boolLabel ?? ""}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label} id={id} hint={field.hint}>
        <SelectInput id={id} value={raw} onChange={onRaw} options={field.options ?? []} />
      </Field>
    );
  }

  if (field.type === "area" || field.type === "lines" || field.type === "pairs") {
    return (
      <Field label={field.label} id={id} hint={field.hint}>
        <TextArea
          id={id}
          value={raw}
          onChange={onRaw}
          rows={field.rows}
          placeholder={field.type === "area" ? field.hint : undefined}
        />
      </Field>
    );
  }

  return (
    <Field label={field.label} id={id} hint={field.hint}>
      <TextInput id={id} value={raw} onChange={onRaw} placeholder={field.hint} />
    </Field>
  );
}
