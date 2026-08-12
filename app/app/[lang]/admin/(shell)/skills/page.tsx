import { EntityView } from "@/components/admin/entity-view";
import { getSkillGroups, getTheme } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Skills — CV admin" };

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const [rows, theme, dict] = await Promise.all([
    getSkillGroups(),
    getTheme(),
    getAdminDictionary(),
  ]);
  return <EntityView entity="skills" rows={rows} adminMode={theme.admin} dict={dict} />;
}
