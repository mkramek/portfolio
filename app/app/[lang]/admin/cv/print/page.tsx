import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { CvDocument } from "@/components/cv/cv-document";
import { getCvSettings, getProfile, getTheme } from "@/lib/content";
import { getCvSnapshotById, resolveLiveCv } from "@/lib/cv";
import { APP_DEFAULTS } from "@/lib/defaults";
import { getCvDictionary } from "@/lib/i18n/dictionaries";
import "./print.css";

export const metadata = { title: "CV export" };

export const dynamic = "force-dynamic";

export default async function CvPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string }>;
}) {
  const { snapshot } = await searchParams;
  const [locale, profile, theme] = await Promise.all([lang(), getProfile(), getTheme()]);

  if (snapshot) {
    const frozen = await getCvSnapshotById(snapshot);
    if (!frozen) notFound();
    const cv = { ...APP_DEFAULTS.cv, company: frozen.company, position: frozen.position };
    const cvDict = await getCvDictionary(frozen.locale);
    return (
      <CvDocument
        profile={profile}
        cv={cv}
        content={frozen.snapshot}
        version={frozen.version}
        theme={theme}
        locale={locale}
        cvDict={cvDict}
      />
    );
  }

  const cv = await getCvSettings();
  const [content, cvDict] = await Promise.all([
    resolveLiveCv(cv.locale),
    getCvDictionary(cv.locale),
  ]);
  return (
    <CvDocument
      profile={profile}
      cv={cv}
      content={content}
      theme={theme}
      locale={locale}
      cvDict={cvDict}
    />
  );
}
