import { EntityView } from "@/components/admin/entity-view";
import { getTestimonials, getTheme } from "@/lib/content";
import { getAdminDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "References — CV admin" };

export const dynamic = "force-dynamic";

export default async function ReferencesPage() {
  const [rows, theme, dict] = await Promise.all([
    getTestimonials(),
    getTheme(),
    getAdminDictionary(),
  ]);
  return <EntityView entity="testimonials" rows={rows} adminMode={theme.admin} dict={dict} />;
}
