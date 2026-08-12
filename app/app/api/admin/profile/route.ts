import { NextResponse } from "next/server";
import { getProfile, setProfile } from "@/lib/content";
import { revalidatePublicPortfolio } from "@/lib/revalidate";
import { profileSchema } from "@/lib/schemas/profile";

export async function GET() {
  return NextResponse.json(await getProfile());
}

export async function PUT(request: Request) {
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid profile" }, { status: 400 });
  }
  const isComplete = await setProfile(parsed.data);
  revalidatePublicPortfolio();
  return NextResponse.json({ isComplete });
}
