import { NextResponse } from "next/server";
import { getSections, setSection } from "@/lib/content";
import { revalidatePublicPortfolio } from "@/lib/revalidate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: string; dir?: number };
  const dir = body.dir ?? 0;
  if (dir !== -1 && dir !== 1) {
    return NextResponse.json({ message: "Invalid direction" }, { status: 400 });
  }
  const sections = await getSections();
  const index = sections.findIndex((section) => section.id === body.id);
  const other = index + dir;
  if (index < 0 || other < 0 || other >= sections.length) {
    return NextResponse.json({ message: "Cannot move section" }, { status: 400 });
  }
  const a = sections[index];
  const b = sections[other];
  await setSection({ ...a, sortOrder: b.sortOrder });
  await setSection({ ...b, sortOrder: a.sortOrder });
  revalidatePublicPortfolio();
  return NextResponse.json({});
}
