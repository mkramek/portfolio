"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Field, SelectInput, TagsInput, TextArea, TextInput } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { useLocale } from "@/lib/i18n/use-locale";
import type { Profile } from "@/lib/schemas/profile";
import type { Role } from "@/lib/schemas/role";
import type { SkillGroup } from "@/lib/schemas/skill-group";

type SetupWizardProps = {
  initialProfile: Profile;
  initialRoleCount: number;
  initialSkillGroupCount: number;
  initialIsComplete: boolean;
  dict: AdminDictionary;
};

type StepKey = "profile" | "role" | "skills";

const STEP_ORDER: StepKey[] = ["profile", "role", "skills"];

export default function SetupWizard({
  initialProfile,
  initialRoleCount,
  initialSkillGroupCount,
  initialIsComplete,
  dict,
}: SetupWizardProps) {
  const router = useRouter();
  const locale = useLocale();
  const s = dict.setup;
  const [step, setStep] = useState<StepKey>(() =>
    initialIsComplete
      ? "skills"
      : initialProfile.name
        ? initialRoleCount
          ? "skills"
          : "role"
        : "profile",
  );
  const [done, setDone] = useState<Record<StepKey, boolean>>({
    profile: Boolean(initialProfile.name),
    role: initialRoleCount > 0,
    skills: initialSkillGroupCount > 0,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const profile = { ...initialProfile };
  const role: Role = {
    company: "",
    title: "",
    start: "",
    end: "",
    kind: "",
    location: "",
    depth: "simple",
    oneLiner: "",
    bullets: [],
    metrics: [],
    stack: [],
    caseStudy: { context: "", approach: "", impact: "" },
    includeInCv: true,
    sortOrder: initialRoleCount,
  };
  const skillGroup: SkillGroup = { group: "", items: [], sortOrder: initialSkillGroupCount };

  async function saveProfile(input: Profile) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(s.profileError);
      return;
    }
    setDone((d) => ({ ...d, profile: true }));
    advance("profile");
  }

  async function saveRole(input: Role) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(s.roleError);
      return;
    }
    setDone((d) => ({ ...d, role: true }));
    advance("role");
  }

  async function saveSkillGroup(input: SkillGroup) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/skill-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setBusy(false);
    if (!res.ok) {
      setMessage(s.skillsError);
      return;
    }
    setDone((d) => ({ ...d, skills: true }));
    advance("skills");
    router.refresh();
  }

  function advance(key: StepKey) {
    const idx = STEP_ORDER.indexOf(key);
    setStep(idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : key);
  }

  const allDone = STEP_ORDER.every((k) => done[k]);

  return (
    <div className="mt-6 w-full max-w-2xl space-y-4">
      <div className="flex gap-6 text-xs uppercase tracking-widest text-dim">
        <span className={done.profile ? "text-ac" : ""}>{s.stepProfile}</span>
        <span className={done.role ? "text-ac" : ""}>{s.stepExperience}</span>
        <span className={done.skills ? "text-ac" : ""}>{s.stepSkills}</span>
      </div>

      {message && <p className="text-xs text-dim">{message}</p>}

      {allDone ? (
        <section className="border border-line bg-panel p-6">
          <h2 className="font-sans text-lg font-semibold tracking-tight">{s.completeTitle}</h2>
          <p className="mt-2 text-sm text-dim">{s.completeBody}</p>
          <Link
            href={`/${locale}`}
            className="mt-4 inline-block border border-ac bg-ac px-3 py-2 text-sm text-acfg"
          >
            {s.viewSite}
          </Link>
        </section>
      ) : (
        <section className="border border-line bg-panel p-6">
          {step === "profile" && (
            <ProfileStep initial={profile} onSave={saveProfile} busy={busy} dict={dict} />
          )}
          {step === "role" && <RoleStep initial={role} onSave={saveRole} busy={busy} dict={dict} />}
          {step === "skills" && (
            <SkillGroupStep initial={skillGroup} onSave={saveSkillGroup} busy={busy} dict={dict} />
          )}
        </section>
      )}
    </div>
  );
}

function StepShell({
  title,
  blurb,
  busy,
  submitLabel,
  children,
  onSubmit,
}: {
  title: string;
  blurb: string;
  busy: boolean;
  submitLabel: string;
  children: ReactNode;
  onSubmit: () => void;
}) {
  return (
    <>
      <h2 className="font-sans text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-dim">{blurb}</p>
      <div className="mt-4 space-y-4">{children}</div>
      <Button onClick={onSubmit} disabled={busy} className="mt-6 w-full px-3 py-2 text-sm">
        {submitLabel}
      </Button>
    </>
  );
}

function ProfileStep({
  initial,
  onSave,
  busy,
  dict,
}: {
  initial: Profile;
  onSave: (p: Profile) => void;
  busy: boolean;
  dict: AdminDictionary;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof Profile) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const f = dict.fields;
  return (
    <StepShell
      title={dict.setup.profileStepTitle}
      blurb={dict.setup.profileStepBlurb}
      busy={busy}
      submitLabel={dict.setup.saveProfile}
      onSubmit={() => onSave(form)}
    >
      <Field label={f["profile.name"]?.label ?? "NAME"} id="profile-name">
        <TextInput
          id="profile-name"
          value={form.name}
          onChange={set("name")}
          placeholder="Milosz Kramek"
        />
      </Field>
      <Field label={f["profile.title"]?.label ?? "TITLE"} id="profile-title">
        <TextInput id="profile-title" value={form.title} onChange={set("title")} />
      </Field>
      <Field label={f["profile.email"]?.label ?? "EMAIL"} id="profile-email">
        <TextInput
          id="profile-email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
        />
      </Field>
      <Field label={f["profile.summary"]?.label ?? "SUMMARY"} id="profile-summary">
        <TextArea
          id="profile-summary"
          value={form.summary ?? ""}
          onChange={set("summary")}
          rows={4}
        />
      </Field>
    </StepShell>
  );
}

function RoleStep({
  initial,
  onSave,
  busy,
  dict,
}: {
  initial: Role;
  onSave: (r: Role) => void;
  busy: boolean;
  dict: AdminDictionary;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof Role) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const f = dict.fields;
  const depthOptions = [
    { value: "simple", label: dict.setup.depthOptions.simple },
    { value: "extended", label: dict.setup.depthOptions.extended },
    { value: "advanced", label: dict.setup.depthOptions.advanced },
  ];
  return (
    <StepShell
      title={dict.setup.roleStepTitle}
      blurb={dict.setup.roleStepBlurb}
      busy={busy}
      submitLabel={dict.setup.saveRole}
      onSubmit={() => onSave(form)}
    >
      <Field label={f["role.company"]?.label ?? "COMPANY"} id="role-company">
        <TextInput id="role-company" value={form.company} onChange={set("company")} />
      </Field>
      <Field label={f["role.title"]?.label ?? "ROLE TITLE"} id="role-title">
        <TextInput id="role-title" value={form.title} onChange={set("title")} />
      </Field>
      <Field label={f["role.start"]?.label ?? "START"} id="role-start" hint={f["role.start"]?.hint}>
        <TextInput id="role-start" value={form.start} onChange={set("start")} />
      </Field>
      <Field label={f["role.end"]?.label ?? "END"} id="role-end" hint={f["role.end"]?.hint}>
        <TextInput id="role-end" value={form.end} onChange={set("end")} />
      </Field>
      <Field label={f["role.oneLiner"]?.label ?? "ONE-LINER"} id="role-oneliner">
        <TextArea id="role-oneliner" value={form.oneLiner} onChange={set("oneLiner")} rows={2} />
      </Field>
      <Field label={f["role.depth"]?.label ?? "DETAIL LEVEL"} id="role-depth">
        <SelectInput
          id="role-depth"
          value={form.depth}
          onChange={set("depth")}
          options={depthOptions}
        />
      </Field>
    </StepShell>
  );
}

function SkillGroupStep({
  initial,
  onSave,
  busy,
  dict,
}: {
  initial: SkillGroup;
  onSave: (s: SkillGroup) => void;
  busy: boolean;
  dict: AdminDictionary;
}) {
  const [form, setForm] = useState(initial);
  const f = dict.fields;
  return (
    <StepShell
      title={dict.setup.skillsStepTitle}
      blurb={dict.setup.skillsStepBlurb}
      busy={busy}
      submitLabel={dict.setup.saveSkills}
      onSubmit={() => onSave(form)}
    >
      <Field label={f["skillGroup.group"]?.label ?? "GROUP"} id="skill-group">
        <TextInput
          id="skill-group"
          value={form.group}
          onChange={(v) => setForm((f) => ({ ...f, group: v }))}
        />
      </Field>
      <Field
        label={f["skillGroup.items"]?.label ?? "SKILLS"}
        id="skill-items"
        hint={f["skillGroup.items"]?.hint}
      >
        <TagsInput
          id="skill-items"
          value={form.items}
          onChange={(v) => setForm((f) => ({ ...f, items: v }))}
        />
      </Field>
    </StepShell>
  );
}
