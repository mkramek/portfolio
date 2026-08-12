import { CvBuilder } from "@/components/admin/cv-builder";
import { CvHistory } from "@/components/admin/cv-history";
import { TabHeader } from "@/components/admin/tab-header";
import { getCvSettings, getLocales, getProfile, getProjects, getRoles } from "@/lib/content";
import { getCvSnapshotsWithVersions } from "@/lib/cv";
import { LOCALE_CATALOGUE } from "@/lib/i18n/config";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "CV — CV admin" };

export const dynamic = "force-dynamic";

export default async function CvPage() {
  const [cv, profile, roles, projects, snapshots, dict, locales] = await Promise.all([
    getCvSettings(),
    getProfile(),
    getRoles(),
    getProjects(),
    getCvSnapshotsWithVersions(),
    getAdminDictionary(),
    getLocales(),
  ]);

  const enabledLocales = locales
    .filter((locale) => locale.enabled)
    .map((locale) => ({
      code: locale.code,
      nativeName: LOCALE_CATALOGUE.find((c) => c.code === locale.code)?.nativeName ?? locale.code,
    }));

  return (
    <div>
      <TabHeader title={dict.pages.cv.title} help={dict.pages.cv.help} />
      <div
        className="mt-6 grid items-start gap-6"
        style={{ gridTemplateColumns: "330px minmax(0,1fr)" }}
      >
        <div className="sticky top-[71px]">
          <CvBuilder
            cv={cv}
            profileSummary={profile.summary}
            roles={roles}
            projects={projects}
            enabledLocales={enabledLocales}
            dict={dict}
          />
        </div>
        <div className="min-w-0">
          <div className="border border-line bg-panel p-5">
            <p className="text-[10.5px] font-semibold tracking-[.14em] text-dim">
              {dict.cvBuilder.printAndDownload}
            </p>
            <p className="mt-2 font-sans text-[12px] leading-[1.6] text-dim">
              {dict.cvBuilder.downloadBlurb}
            </p>
            <p className="mt-3 font-sans text-[12px] leading-[1.6] text-dim">
              {dict.cvBuilder.orderBlurb}
            </p>
          </div>
          <div className="mt-6">
            <CvHistory snapshots={snapshots} dict={dict} />
          </div>
        </div>
      </div>
    </div>
  );
}
