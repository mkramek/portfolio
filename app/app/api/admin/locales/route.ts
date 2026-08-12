import { NextResponse } from "next/server";
import { getLocales, setLocale } from "@/lib/content";
import { isLocaleCode } from "@/lib/i18n/config";
import { revalidatePublicPortfolio } from "@/lib/revalidate";

export async function GET() {
  return NextResponse.json(await getLocales());
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: string; enabled?: boolean };
  if (!body.code || !isLocaleCode(body.code) || typeof body.enabled !== "boolean") {
    return NextResponse.json({ message: "Invalid locale toggle" }, { status: 400 });
  }
  await setLocale(body.code, body.enabled);
  // Enabling/disabling a locale changes which /[lang] paths 404 publicly (see
  // app/[lang]/page.tsx) and the sitemap's contents — both must drop their cache too.
  revalidatePublicPortfolio();
  return NextResponse.json(await getLocales());
}
