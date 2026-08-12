"use client";

import {
  BoolInput,
  Field,
  LinesInput,
  PairsInput,
  SelectInput,
  TagsInput,
  TextArea,
  TextInput,
} from "@/components/admin/fields";
import { type FieldSpec, parsePairs } from "@/lib/admin/fields";

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

  if (field.type === "lines") {
    return (
      <Field label={field.label} id={id} hint={field.hint}>
        <LinesInput
          id={id}
          value={raw ? raw.split("\n") : []}
          onChange={(lines) => onRaw(lines.join("\n"))}
          rows={field.rows}
        />
      </Field>
    );
  }

  if (field.type === "pairs") {
    return (
      <Field label={field.label} id={id} hint={field.hint}>
        <PairsInput
          id={id}
          value={raw ? parsePairs(raw) : []}
          onChange={(pairs) =>
            onRaw(pairs.map((pair) => `${pair.value} | ${pair.label}`).join("\n"))
          }
          rows={field.rows}
        />
      </Field>
    );
  }

  if (field.type === "tags") {
    return (
      <Field label={field.label} id={id} hint={field.hint}>
        <TagsInput
          id={id}
          value={
            raw
              ? raw
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              : []
          }
          onChange={(tags) => onRaw(tags.join(", "))}
          placeholder={field.hint}
        />
      </Field>
    );
  }

  if (field.type === "area") {
    return (
      <Field label={field.label} id={id} hint={field.hint}>
        <TextArea id={id} value={raw} onChange={onRaw} rows={field.rows} placeholder={field.hint} />
      </Field>
    );
  }

  return (
    <Field label={field.label} id={id} hint={field.hint}>
      <TextInput id={id} value={raw} onChange={onRaw} placeholder={field.hint} />
    </Field>
  );
}
