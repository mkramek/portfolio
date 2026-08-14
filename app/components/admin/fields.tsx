"use client";

import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  id: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, id, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-dim">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-dim">{hint}</span>}
    </div>
  );
}

type TextInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function TextInput({ id, value, onChange, placeholder }: TextInputProps) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-line bg-panel2 px-3 py-2 text-sm outline-none focus:border-ac"
    />
  );
}

type TextAreaProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

export function TextArea({ id, value, onChange, rows = 4, placeholder }: TextAreaProps) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full resize-y border border-line bg-panel2 px-3 py-2 font-mono text-sm outline-none focus:border-ac"
    />
  );
}

type SelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function SelectInput({ id, value, onChange, options }: SelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-line bg-panel2 px-3 py-2 text-sm outline-none focus:border-ac"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

type BoolProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function BoolInput({ id, checked, onChange, label }: BoolProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={`grid size-4 place-items-center border text-acfg ${
          checked ? "border-ac bg-ac" : "border-line bg-panel2"
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 6.5 4.5 9 10 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
