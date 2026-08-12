import { NextResponse } from "next/server";
import { setTranslation } from "@/lib/content";
import { DEFAULT_LOCALE, isLocaleCode } from "@/lib/i18n/config";
import { TRANSLATABLE_ENTITIES } from "@/lib/i18n/translatable";
import { isValidTranslationValues } from "@/lib/i18n/translation-validation";
import { revalidatePublicPortfolio } from "@/lib/revalidate";
import type { TranslatableEntity } from "@/lib/schemas/translation";

type RouteContext = { params: Promise<{ entity: string; entityId: string }> };

function isTranslatableEntity(value: string): value is TranslatableEntity {
  return (TRANSLATABLE_ENTITIES as string[]).includes(value);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { entity, entityId } = await params;
  if (!isTranslatableEntity(entity)) {
    return NextResponse.json({ message: "Unknown entity" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    locale?: string;
    values?: unknown;
  } | null;
  if (!body?.locale || !isLocaleCode(body.locale) || body.locale === DEFAULT_LOCALE) {
    return NextResponse.json({ message: "Invalid target locale" }, { status: 400 });
  }
  if (!isValidTranslationValues(entity, body.values)) {
    return NextResponse.json({ message: "Invalid translation values" }, { status: 400 });
  }

  await setTranslation(entity, entityId, body.locale, body.values);
  revalidatePublicPortfolio();
  return NextResponse.json({});
}
