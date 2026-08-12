import { AppearanceView } from "@/components/admin/appearance-view";
import { TabHeader } from "@/components/admin/tab-header";
import { getTheme } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Appearance — CV admin" };

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const [theme, dict] = await Promise.all([getTheme(), getAdminDictionary()]);
  return (
    <div>
      <TabHeader title={dict.pages.appearance.title} help={dict.pages.appearance.help} />
      <AppearanceView theme={theme} dict={dict} />
    </div>
  );
}
