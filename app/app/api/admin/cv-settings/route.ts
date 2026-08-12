import { NextResponse } from "next/server";
import { getCvSettings, setCvSettings } from "@/lib/content";
import { cvSettingsSchema } from "@/lib/schemas/cv-settings";

export async function GET() {
  return NextResponse.json(await getCvSettings());
}

export async function PUT(request: Request) {
  const parsed = cvSettingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid CV settings" }, { status: 400 });
  }
  await setCvSettings(parsed.data);
  return NextResponse.json({});
}
