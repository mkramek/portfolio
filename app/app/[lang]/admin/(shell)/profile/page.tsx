import { ProfilePanel } from "@/components/admin/profile-panel";
import { TabHeader } from "@/components/admin/tab-header";
import { EDUCATION_FIELDS, localizeFieldSpecs, PROFILE_FIELDS } from "@/lib/admin/fields";
import { getEducation, getProfile } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Profile — CV admin" };

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, education, dict] = await Promise.all([
    getProfile(),
    getEducation(),
    getAdminDictionary(),
  ]);
  const profileFields = localizeFieldSpecs(PROFILE_FIELDS, dict.fields, "profile");
  const educationFields = localizeFieldSpecs(EDUCATION_FIELDS, dict.fields, "education");
  return (
    <div>
      <TabHeader title={dict.pages.profile.title} help={dict.pages.profile.help} />
      <ProfilePanel
        initialProfile={profile}
        initialEducation={education}
        profileFields={profileFields}
        educationFields={educationFields}
        dict={dict}
      />
    </div>
  );
}
