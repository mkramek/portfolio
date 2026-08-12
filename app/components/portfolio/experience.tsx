import type { RoleRow } from "@/lib/content";
import type { LocaleCode } from "@/lib/i18n/config";
import type { PublicDictionary } from "@/lib/i18n/dictionaries/en/public";
import { pluralize } from "@/lib/i18n/plural";
import { CaseStudy } from "./case-study";
import { LedgerRoleRow } from "./ledger-row";
import { SectionHeader } from "./section-header";
import type { DerivedRole } from "./types";

type ExperienceDict = PublicDictionary["experience"];

export function Experience({
  num,
  label,
  timeline,
  roles,
  locale,
  dict,
}: {
  num: string;
  label: string;
  timeline: "rail" | "ledger" | "cards";
  roles: RoleRow[];
  locale: LocaleCode;
  dict: ExperienceDict;
}) {
  const derived = roles.map((role) => deriveRole(role, dict));

  return (
    <div>
      <SectionHeader
        num={num}
        label={label}
        className="mb-[30px]"
        end={
          <span className="font-mono text-[11px] leading-none text-dim">
            {roles.length} {pluralize(locale, roles.length, dict.rolesCount)}
          </span>
        }
      />
      {timeline === "rail" && <TimelineRail roles={derived} dict={dict} />}
      {timeline === "ledger" && <TimelineLedger roles={derived} dict={dict} />}
      {timeline === "cards" && <TimelineCards roles={derived} />}
    </div>
  );
}

function deriveRole(r: RoleRow, dict: ExperienceDict): DerivedRole {
  const caseRows =
    r.depth === "advanced"
      ? [
          { label: dict.context, text: r.caseStudy.context },
          { label: dict.approach, text: r.caseStudy.approach },
          { label: dict.impact, text: r.caseStudy.impact },
        ].filter((c) => c.text)
      : [];
  const dates = `${r.start} – ${r.end}`;
  return {
    id: r.id,
    company: r.company,
    title: r.title,
    kind: r.kind,
    oneLiner: r.oneLiner,
    dates,
    depth: r.depth,
    depthLabel: dict.depth[r.depth],
    extended: r.depth !== "simple",
    advanced: r.depth === "advanced" && caseRows.length > 0,
    metrics: r.metrics,
    stack: r.stack,
    bullets: r.bullets,
    caseRows,
  };
}

function TimelineRail({ roles, dict }: { roles: DerivedRole[]; dict: ExperienceDict }) {
  return (
    <div>
      {roles.map((r) => (
        <div key={r.id} className="grid grid-cols-[132px_minmax(0,1fr)] items-start gap-x-[20px]">
          <div className="pt-[3px] text-right">
            <div className="font-mono text-[11.5px] font-medium leading-[1.5]">{r.dates}</div>
            <div className="font-mono text-[10.5px] leading-[1.5] text-dim">{r.kind}</div>
          </div>
          <div className="relative border-l border-line pb-[34px] pl-[26px]">
            <span className="absolute -left-[4px] top-[6px] h-[7px] w-[7px] rounded-full bg-ac" />
            <div className="flex flex-wrap items-baseline gap-x-[12px] gap-y-[7px]">
              <h3 className="m-0 font-mono text-[17px] font-semibold leading-[1.2] tracking-[-.025em]">
                {r.company}
              </h3>
              <span className="font-mono text-[13px] leading-[1.3] text-dim">{r.title}</span>
              <span className="rounded-[2px] border border-line p-[4px_6px] font-mono text-[9.5px] font-semibold leading-none tracking-[.1em] text-dim">
                {r.depthLabel}
              </span>
            </div>
            <p className="mt-[9px] max-w-[64ch] font-sans text-[14px] leading-[1.62] text-pretty">
              {r.oneLiner}
            </p>
            {r.extended && (
              <div>
                <div className="mt-[16px] flex flex-wrap gap-[26px]">
                  {r.metrics.map((m) => (
                    <div key={`${m.value}-${m.label}`}>
                      <div className="font-mono text-[16px] font-semibold leading-none tracking-[-.02em] text-ac">
                        {m.value}
                      </div>
                      <div className="mt-[5px] font-mono text-[10.5px] leading-[1.3] text-dim">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="mt-[15px] grid list-none gap-[6px] p-0">
                  {r.bullets.map((b) => (
                    <li
                      key={b}
                      className="grid max-w-[70ch] grid-cols-[14px_1fr] gap-x-[8px] font-sans text-[13.5px] leading-[1.6] text-dim"
                    >
                      <span className="text-ac">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-[16px] flex flex-wrap gap-[6px]">
                  {r.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded-[2px] border border-line p-[5px_8px] font-mono text-[10.5px] leading-none text-dim"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {r.advanced && (
              <CaseStudy
                caseRows={r.caseRows}
                openLabel={dict.caseStudyOpen}
                closeLabel={dict.caseStudyClose}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineLedger({ roles, dict }: { roles: DerivedRole[]; dict: ExperienceDict }) {
  return (
    <div className="border-t border-line">
      {roles.map((r) => (
        <LedgerRoleRow
          key={r.id}
          role={r}
          openLabel={dict.ledgerOpen}
          closeLabel={dict.ledgerClose}
        />
      ))}
    </div>
  );
}

function TimelineCards({ roles }: { roles: DerivedRole[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[16px]">
      {roles.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-[11px] rounded-[4px] border border-line bg-panel p-[20px_20px_22px] transition-colors duration-200 hover:border-ac"
        >
          <div className="flex items-baseline justify-between gap-[10px]">
            <span className="font-mono text-[10.5px] leading-none text-dim">{r.dates}</span>
            <span className="font-mono text-[9.5px] font-semibold leading-none tracking-[.1em] text-ac">
              {r.depthLabel}
            </span>
          </div>
          <h3 className="m-0 font-mono text-[16px] font-semibold leading-[1.25] tracking-[-.025em]">
            {r.company}
          </h3>
          <div className="font-mono text-[12px] leading-[1.4] text-dim">
            {r.title} · {r.kind}
          </div>
          <p className="m-0 font-sans text-[13.5px] leading-[1.6] text-dim text-pretty">
            {r.oneLiner}
          </p>
          <div className="mt-auto flex flex-wrap gap-[5px] pt-[6px]">
            {r.stack.map((t) => (
              <span
                key={t}
                className="rounded-[2px] bg-panel2 p-[4px_7px] font-mono text-[10px] leading-none text-dim"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
