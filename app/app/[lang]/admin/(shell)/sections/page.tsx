import { SectionsView } from "@/components/admin/sections-view";
import { TabHeader } from "@/components/admin/tab-header";
import { getSections } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Sections — CV admin" };

export const dynamic = "force-dynamic";

export default async function SectionsPage() {
  const [sections, dict] = await Promise.all([getSections(), getAdminDictionary()]);
  return (
    <div>
      <TabHeader title={dict.pages.sections.title} help={dict.pages.sections.help} />
      <SectionsView sections={sections} dict={dict.sectionsView} />
    </div>
  );
}
