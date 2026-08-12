"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProjectRow, RoleRow } from "@/lib/content";
import type { LocaleCode } from "@/lib/i18n/config";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/en/admin";
import { useLocale } from "@/lib/i18n/use-locale";
import type { CvSettings } from "@/lib/schemas/cv-settings";

export function CvBuilder({
  cv,
  profileSummary,
  roles,
  projects,
  enabledLocales,
  dict: fullDict,
}: {
  cv: CvSettings;
  profileSummary: string;
  roles: RoleRow[];
  projects: ProjectRow[];
  enabledLocales: Array<{ code: LocaleCode; nativeName: string }>;
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [draft, setDraft] = useState<CvSettings>(cv);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dict = fullDict.cvBuilder;
  const common = fullDict.common;

  const sectionToggles: Array<{ key: keyof CvSettings; label: string }> = [
    { key: "includeSkills", label: dict.sectionToggles.includeSkills },
    { key: "includeProjects", label: dict.sectionToggles.includeProjects },
    { key: "includeTestimonials", label: dict.sectionToggles.includeTestimonials },
    { key: "includeEducation", label: dict.sectionToggles.includeEducation },
    { key: "includeLanguages", label: dict.sectionToggles.includeLanguages },
  ];

  async function saveCv(next: CvSettings) {
    setDraft(next);
    const res = await fetch("/api/admin/cv-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (res.ok) router.refresh();
  }

  async function toggleRole(role: RoleRow) {
    const res = await fetch(`/api/admin/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...role, includeInCv: !role.includeInCv }),
    });
    if (res.ok) router.refresh();
  }

  async function toggleProject(project: ProjectRow) {
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...project, includeInCv: !project.includeInCv }),
    });
    if (res.ok) router.refresh();
  }

  async function moveRole(id: string, dir: -1 | 1) {
    const res = await fetch(`/api/admin/roles/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    });
    if (res.ok) router.refresh();
  }

  async function downloadPdf() {
    setBusy(true);
    setMessage(null);
    await saveCv(draft);
    const res = await fetch("/api/cv/pdf", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setMessage(dict.pdfFailed);
      return;
    }
    router.refresh();
    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match?.[1] ?? "cv.pdf";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const labelClass = "block text-[10.5px] font-medium tracking-[.1em] text-dim";
  const inputClass =
    "w-full rounded-[3px] border border-line bg-panel px-2.5 py-2 text-[12px] leading-[1.4] text-fg outline-none focus:border-ac";

  return (
    <aside className="border border-line bg-bg">
      <div className="px-5 pb-10 pt-5">
        <div className="text-[11px] font-semibold tracking-[.14em] text-ac">{dict.heading}</div>
        <p className="mt-2.5 font-sans text-[12px] leading-[1.6] text-dim">{dict.blurb}</p>
        <Button
          onClick={downloadPdf}
          disabled={busy}
          className="mt-4 w-full rounded-[3px] px-3.5 py-3 text-[11px] font-semibold tracking-[.1em]"
        >
          {busy ? dict.generatingPdf : dict.downloadPdf}
        </Button>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Link
            href={`/${locale}/admin/cv/print`}
            target="_blank"
            className="rounded-[3px] border border-line px-3 py-2 text-[10px] font-medium tracking-[.1em] text-dim hover:border-fg hover:text-fg"
          >
            {dict.openPrintPreview}
          </Link>
          {message && <span className="text-[10.5px] text-dim">{message}</span>}
        </div>

        {enabledLocales.length > 1 && (
          <div className="mt-5">
            <div className={labelClass}>{dict.contentLanguage}</div>
            <select
              value={draft.locale}
              onChange={(e) => saveCv({ ...draft, locale: e.target.value as CvSettings["locale"] })}
              className={`${inputClass} mt-2`}
            >
              {enabledLocales.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.nativeName} · {locale.code}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6">
          <div className={labelClass}>{dict.targetRole}</div>
          <div className="mt-2 grid gap-2">
            <input
              value={draft.position}
              onChange={(e) => setDraft({ ...draft, position: e.target.value })}
              onBlur={() => saveCv(draft)}
              placeholder={dict.positionPlaceholder}
              className={inputClass}
            />
            <input
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              onBlur={() => saveCv(draft)}
              placeholder={dict.companyPlaceholder}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="cv-summary" className={labelClass}>
            {dict.tailoredSummary}
          </label>
          <textarea
            id="cv-summary"
            rows={7}
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            onBlur={() => saveCv(draft)}
            placeholder={dict.summaryPlaceholder}
            className="mt-2 w-full resize-y rounded-[3px] border border-line bg-panel px-2.5 py-2 text-[12px] leading-[1.6] text-fg outline-none focus:border-ac"
          />
          <Button
            variant="secondary"
            onClick={() => saveCv({ ...draft, summary: profileSummary })}
            className="mt-1.5 rounded-[3px] px-2.5 py-1.5 text-[10px] tracking-[.08em]"
          >
            {dict.resetToProfileSummary}
          </Button>
        </div>

        <div className="mt-6">
          <div className={labelClass}>{dict.sections}</div>
          <div className="mt-1.5 grid gap-0.5">
            {sectionToggles.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-2.5 rounded-[2px] px-1.5 py-1.5 text-fg hover:bg-panel2"
              >
                <Checkbox
                  checked={Boolean(draft[key])}
                  onChange={() => saveCv({ ...draft, [key]: !draft[key] })}
                />
                <span className="text-[12px] leading-[1.4]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className={labelClass}>{dict.rolesIncludeOrder}</div>
          <div className="mt-1.5 grid gap-0.5">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-2 rounded-[2px] px-1.5 py-1">
                <Checkbox checked={role.includeInCv} onChange={() => toggleRole(role)} />
                <button
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-fg"
                >
                  <span className="block truncate text-[11.5px] leading-[1.35]">
                    {role.company} · {role.start}
                  </span>
                </button>
                <Button
                  variant="secondary"
                  title={common.moveUp}
                  onClick={() => moveRole(role.id, -1)}
                  className="grid size-[22px] shrink-0 place-items-center text-[10px] leading-none"
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  title={common.moveDown}
                  onClick={() => moveRole(role.id, 1)}
                  className="grid size-[22px] shrink-0 place-items-center text-[10px] leading-none"
                >
                  ↓
                </Button>
              </div>
            ))}
            {roles.length === 0 && <p className="text-[11px] text-dim">{dict.noRoles}</p>}
          </div>
        </div>

        <div className="mt-6">
          <div className={labelClass}>{dict.projectsInCv}</div>
          <div className="mt-1.5 grid gap-0.5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2.5 rounded-[2px] px-1.5 py-1.5 text-fg hover:bg-panel2"
              >
                <Checkbox checked={project.includeInCv} onChange={() => toggleProject(project)} />
                <span className="truncate text-[11.5px] leading-[1.35]">{project.name}</span>
              </div>
            ))}
            {projects.length === 0 && <p className="text-[11px] text-dim">{dict.noProjects}</p>}
          </div>
        </div>
      </div>
    </aside>
  );
}
