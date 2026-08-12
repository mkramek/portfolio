import type { RoleRow } from "@/lib/content";
import type { PublicDictionary } from "@/lib/i18n/dictionaries/en/public";
import type { Profile } from "@/lib/schemas/profile";
import type { Theme } from "@/lib/schemas/theme";

type HeroDict = PublicDictionary["hero"];

export function Hero({
  theme,
  profile,
  roles,
  dict,
}: {
  theme: Theme;
  profile: Profile;
  roles: RoleRow[];
  dict: HeroDict;
}) {
  const tagline = profile.tagline || profile.summary;

  return (
    <div>
      {theme.hero === "monolith" && (
        <HeroMonolith profile={profile} tagline={tagline} roles={roles} dict={dict} />
      )}
      {theme.hero === "terminal" && (
        <HeroTerminal profile={profile} tagline={tagline} dict={dict} />
      )}
      {theme.hero === "ledger" && <HeroLedger profile={profile} tagline={tagline} dict={dict} />}
    </div>
  );
}

function HeroMonolith({
  profile,
  tagline,
  roles,
  dict,
}: {
  profile: Profile;
  tagline: string;
  roles: RoleRow[];
  dict: HeroDict;
}) {
  const heroStats = profile.heroStats?.length
    ? profile.heroStats
    : [{ value: String(roles.length), label: dict.engagementsDelivered }];

  return (
    <div>
      <div className="flex items-center gap-[10px] font-mono text-[11px] leading-none tracking-[.12em] text-dim">
        <span className="h-[7px] w-[7px] rounded-full bg-ac" />
        {(profile.availability || "").toUpperCase()}
      </div>
      <h1 className="mt-[22px] font-mono text-[clamp(40px,7.4vw,92px)] font-bold leading-[0.94] tracking-[-.045em] text-balance">
        {profile.name}
      </h1>
      <p className="mt-[14px] font-mono text-[clamp(15px,1.7vw,21px)] font-medium leading-[1.3] tracking-[-.01em] text-ac">
        {profile.title}
      </p>
      <p className="mt-[26px] max-w-[66ch] font-sans text-[16px] leading-[1.65] text-dim text-pretty">
        {tagline}
      </p>
      <div className="mt-[44px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px border border-line bg-line">
        {heroStats.map((m) => (
          <div key={`${m.value}-${m.label}`} className="bg-bg p-[16px_18px]">
            <div className="font-mono text-[22px] font-semibold leading-none tracking-[-.03em]">
              {m.value}
            </div>
            <div className="mt-[7px] font-mono text-[10.5px] leading-[1.3] tracking-[.06em] text-dim">
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroTerminal({
  profile,
  tagline,
  dict,
}: {
  profile: Profile;
  tagline: string;
  dict: HeroDict;
}) {
  const handle = profile.handle || profile.name;

  return (
    <div className="overflow-hidden rounded-[5px] border border-line bg-panel">
      <div className="flex items-center gap-[8px] border-b border-line bg-panel2 p-[9px_13px]">
        <span className="h-[9px] w-[9px] rounded-full bg-line" />
        <span className="h-[9px] w-[9px] rounded-full bg-line" />
        <span className="h-[9px] w-[9px] rounded-full bg-ac" />
        <span className="ml-[6px] font-mono text-[11px] leading-none text-dim">
          ~/{handle} — zsh
        </span>
      </div>
      <div className="p-[26px_24px_30px] font-mono text-[13.5px] leading-[1.85]">
        <div className="text-dim">
          <span className="text-ac">➜</span> whoami
        </div>
        <div className="mt-[6px] mb-[20px] font-mono text-[clamp(28px,4.6vw,52px)] font-bold leading-[1.05] tracking-[-.04em]">
          {profile.name}
        </div>
        <div className="text-dim">
          <span className="text-ac">➜</span> cat role.txt
        </div>
        <div className="mt-[4px] mb-[20px]">
          {profile.title}
          {profile.location ? ` · ${profile.location}` : ""}
        </div>
        <div className="text-dim">
          <span className="text-ac">➜</span> head -4 summary.md
        </div>
        <p className="mt-[6px] mb-[20px] max-w-[72ch] font-mono text-[13.5px] leading-[1.8] text-fg text-pretty">
          {tagline}
        </p>
        <div className="text-dim">
          <span className="text-ac">➜</span> {dict.status}
        </div>
        <div className="mt-[4px] text-ac">
          {profile.availability}
          <span className="ml-[8px] inline-block h-[15px] w-[8px] bg-ac align-[-2px]" />
        </div>
      </div>
    </div>
  );
}

function HeroLedger({
  profile,
  tagline,
  dict,
}: {
  profile: Profile;
  tagline: string;
  dict: HeroDict;
}) {
  const ledgerRows = profile.ledgerRows?.length
    ? profile.ledgerRows
    : [
        { label: dict.ledgerRole, value: profile.title },
        { label: dict.ledgerBased, value: profile.location || "—" },
        { label: dict.ledgerContact, value: profile.email },
      ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-start gap-[48px]">
      <div>
        <h1 className="m-0 font-mono text-[clamp(32px,4.6vw,58px)] font-bold leading-[1.02] tracking-[-.04em]">
          {profile.name}
        </h1>
        <p className="mt-[16px] max-w-[42ch] font-sans text-[14px] leading-[1.7] text-dim text-pretty">
          {tagline}
        </p>
        {profile.availability && (
          <div className="mt-[26px] inline-flex items-center gap-[9px] rounded-[3px] border border-ac p-[8px_12px] font-mono text-[11px] font-medium leading-none tracking-[.06em] text-ac">
            <span className="h-[6px] w-[6px] rounded-full bg-ac" />
            {profile.availability}
          </div>
        )}
      </div>
      <div className="border-t border-line">
        {ledgerRows.map((m) => (
          <div
            key={`${m.label}-${m.value}`}
            className="grid grid-cols-[110px_1fr] gap-[18px] border-b border-line p-[13px_0]"
          >
            <span className="font-mono text-[10.5px] leading-[1.5] tracking-[.1em] text-dim">
              {m.label}
            </span>
            <span className="font-mono text-[13px] font-medium leading-[1.5]">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
