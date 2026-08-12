import { DataPanel } from "@/components/admin/data-view";
import { TabHeader } from "@/components/admin/tab-header";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Data — CV admin" };

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const dict = await getAdminDictionary();
  return (
    <div>
      <TabHeader title={dict.pages.data.title} help={dict.pages.data.help} />
      <DataPanel dict={dict.dataPanel} />
    </div>
  );
}
