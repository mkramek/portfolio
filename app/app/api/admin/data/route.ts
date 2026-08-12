import { NextResponse } from "next/server";
import { exportAll, importAll } from "@/lib/data";
import { revalidatePublicPortfolio } from "@/lib/revalidate";
import { exportSchema } from "@/lib/schemas/export";

export async function GET() {
  return NextResponse.json(await exportAll());
}

export async function POST(request: Request) {
  const parsed = exportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid backup payload" }, { status: 400 });
  }
  await importAll(parsed.data);
  revalidatePublicPortfolio();
  return NextResponse.json({ ok: true });
}
