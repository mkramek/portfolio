"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type FieldSpec, fromRaw, setPath, toRaw } from "@/lib/admin/fields";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import type { Education } from "@/lib/schemas/education";
import type { Profile } from "@/lib/schemas/profile";
import { FieldControl } from "./field-control";

function SingleRecordCard({
  title,
  blurb,
  fields,
  initial,
  apiBase,
  saveLabel,
  common,
}: {
  title: string;
  blurb: string;
  fields: FieldSpec[];
  initial: Record<string, unknown>;
  apiBase: string;
  saveLabel: string;
  common: AdminDictionary["common"];
}) {
  const router = useRouter();
  const [raw, setRaw] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const field of fields) result[field.key] = toRaw(field, initial as never);
    return result;
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const built: Record<string, unknown> = {};
    for (const field of fields) setPath(built, field.key, fromRaw(field, raw[field.key]));
    setBusy(true);
    setMessage(null);
    const res = await fetch(apiBase, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(built),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(common.couldNotSave);
      return;
    }
    setMessage(null);
    router.refresh();
  }

  return (
    <section className="max-w-[760px] border border-line bg-panel p-5">
      <h3 className="text-[11px] font-semibold tracking-[.1em]">{title}</h3>
      <p className="mb-4 mt-1 font-sans text-[12px] leading-[1.5] text-dim">{blurb}</p>
      <div className="grid gap-3.5">
        {fields.map((field) => (
          <FieldControl
            key={field.key}
            field={field}
            raw={raw[field.key] ?? ""}
            onRaw={(value) => setRaw((prev) => ({ ...prev, [field.key]: value }))}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={save}
          disabled={busy}
          className="px-3.5 py-2 text-[10.5px] font-semibold tracking-[.1em]"
        >
          {busy ? common.saving : saveLabel}
        </Button>
        {message && <span className="text-[11px] text-dim">{message}</span>}
      </div>
    </section>
  );
}

export function ProfilePanel({
  initialProfile,
  initialEducation,
  profileFields,
  educationFields,
  dict,
}: {
  initialProfile: Profile;
  initialEducation: Education;
  profileFields: FieldSpec[];
  educationFields: FieldSpec[];
  dict: AdminDictionary;
}) {
  return (
    <div className="mt-6 grid gap-6">
      <SingleRecordCard
        title={dict.profilePanel.profileTitle}
        blurb={dict.profilePanel.profileBlurb}
        fields={profileFields}
        initial={{
          ...initialProfile,
          heroStats: initialProfile.heroStats ?? [],
          ledgerRows: initialProfile.ledgerRows ?? [],
        }}
        apiBase="/api/admin/profile"
        saveLabel={dict.profilePanel.saveProfile}
        common={dict.common}
      />
      <SingleRecordCard
        title={dict.profilePanel.educationTitle}
        blurb={dict.profilePanel.educationBlurb}
        fields={educationFields}
        initial={initialEducation}
        apiBase="/api/admin/education"
        saveLabel={dict.profilePanel.saveEducation}
        common={dict.common}
      />
    </div>
  );
}
