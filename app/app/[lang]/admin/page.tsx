import { redirect } from "next/navigation";
import { lang } from "next/root-params";

export default async function AdminIndexPage() {
  const locale = await lang();
  redirect(`/${locale}/admin/experience`);
}
