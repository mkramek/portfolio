import { EntityView } from "@/components/admin/entity-view";
import { getRoles, getTheme } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Experience — CV admin" };

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const [rows, theme, dict] = await Promise.all([getRoles(), getTheme(), getAdminDictionary()]);
  return <EntityView entity="roles" rows={rows} adminMode={theme.admin} dict={dict} />;
}
