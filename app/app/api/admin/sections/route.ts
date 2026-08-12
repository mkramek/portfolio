import { NextResponse } from "next/server";
import { setSection } from "@/lib/content";
import { revalidatePublicPortfolio } from "@/lib/revalidate";
import { sectionSchema } from "@/lib/schemas/section";

export async function PUT(request: Request) {
  const parsed = sectionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid section" }, { status: 400 });
  }
  await setSection(parsed.data);
  revalidatePublicPortfolio();
  return NextResponse.json({});
}
