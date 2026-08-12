import { EntityView } from "@/components/admin/entity-view";
import { getProjects, getTheme } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Projects — CV admin" };

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [rows, theme, dict] = await Promise.all([getProjects(), getTheme(), getAdminDictionary()]);
  return <EntityView entity="projects" rows={rows} adminMode={theme.admin} dict={dict} />;
}
