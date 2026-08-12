import { NextResponse } from "next/server";
import { getEducation, setEducation } from "@/lib/content";
import { revalidatePublicPortfolio } from "@/lib/revalidate";
import { educationSchema } from "@/lib/schemas/education";

export async function GET() {
  return NextResponse.json(await getEducation());
}

export async function PUT(request: Request) {
  const parsed = educationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid education" }, { status: 400 });
  }
  await setEducation(parsed.data);
  revalidatePublicPortfolio();
  return NextResponse.json({});
}
