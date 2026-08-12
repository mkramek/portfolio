import { TabHeader } from "@/components/admin/tab-header";
import { getProfile, getRoles, getSetupComplete, getSkillGroups } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";
import PasskeySection from "./passkey-section";
import SetupWizard from "./setup-wizard";

export const metadata = { title: "Setup — CV admin" };

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [profile, roles, skillGroups, isComplete, dict] = await Promise.all([
    getProfile(),
    getRoles(),
    getSkillGroups(),
    getSetupComplete(),
    getAdminDictionary(),
  ]);

  return (
    <div>
      <TabHeader title={dict.pages.setup.title} help={dict.pages.setup.help} />
      <SetupWizard
        initialProfile={profile}
        initialRoleCount={roles.length}
        initialSkillGroupCount={skillGroups.length}
        initialIsComplete={isComplete}
        dict={dict}
      />
      <PasskeySection dict={dict.passkey} />
    </div>
  );
}
