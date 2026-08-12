import { EntityView } from "@/components/admin/entity-view";
import { getStrengths, getTheme } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Strengths — CV admin" };

export const dynamic = "force-dynamic";

export default async function StrengthsPage() {
  const [rows, theme, dict] = await Promise.all([getStrengths(), getTheme(), getAdminDictionary()]);
  return <EntityView entity="strengths" rows={rows} adminMode={theme.admin} dict={dict} />;
}
