import { NextResponse } from "next/server";
import { getTheme, setTheme } from "@/lib/content";
import { revalidatePublicPortfolio } from "@/lib/revalidate";
import { themeSchema } from "@/lib/schemas/theme";

export async function GET() {
  return NextResponse.json(await getTheme());
}

export async function PATCH(request: Request) {
  const parsed = themeSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid theme" }, { status: 400 });
  }
  const merged = { ...(await getTheme()), ...parsed.data };
  await setTheme(merged);
  revalidatePublicPortfolio();
  return NextResponse.json({});
}
