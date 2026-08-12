import type { Profile } from "@/lib/schemas/profile";

function linkedinHref(linkedin: string) {
  return `https://${linkedin.replace(/^https?:\/\//, "")}`;
}

export function Contact({ label, profile }: { label: string; profile: Profile }) {
  const heading = profile.availability || profile.title;

  return (
    <div className="rounded-[5px] border border-line bg-panel p-[34px_30px]">
      <div className="flex flex-wrap items-end justify-between gap-[32px]">
        <div>
          <div className="font-mono text-[11px] font-semibold leading-none tracking-[.14em] text-ac">
            {label}
          </div>
          <h2 className="mt-[16px] max-w-[24ch] font-mono text-[clamp(24px,3.4vw,38px)] font-bold leading-[1.08] tracking-[-.035em] text-balance">
            {heading}
          </h2>
          <div className="mt-[22px] flex flex-wrap gap-[18px] font-mono text-[13px] leading-[1.6]">
            {profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
            {profile.phone && <span className="text-dim">{profile.phone}</span>}
            {profile.linkedin && (
              <a href={linkedinHref(profile.linkedin)} target="_blank" rel="noreferrer">
                {profile.linkedin}
              </a>
            )}
            {profile.location && <span className="text-dim">{profile.location}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
