import chromium from "@sparticuz/chromium";
import { type NextRequest, NextResponse } from "next/server";
import { chromium as playwrightChromium } from "playwright-core";
import { getCvSettings } from "@/lib/content";
import { createCvSnapshot, getCvSnapshotById, resolveLiveCv } from "@/lib/cv";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCookies(header: string): Array<{ name: string; value: string }> {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      if (index < 0) return { name: part, value: "" };
      return { name: part.slice(0, index).trim(), value: part.slice(index + 1).trim() };
    });
}

function safeFilename(company: string, position: string): string {
  const base =
    [position, company]
      .filter(Boolean)
      .join(" ")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cv";
  return `${base}.pdf`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { snapshotId?: string };
  const snapshotId = body.snapshotId;
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  // The route this navigates to lives under app/[lang]/admin/cv/print — the [lang]
  // segment here only satisfies that route requirement (chrome around the document,
  // hidden in print anyway); the document's own text locale comes from
  // CvSettings.locale / CvSnapshot.locale, independent of this prefix (see lib/cv.ts).
  const printPath = `/${DEFAULT_LOCALE}/admin/cv/print`;
  const target = snapshotId
    ? `${origin}${printPath}?snapshot=${snapshotId}`
    : `${origin}${printPath}`;

  const executablePath = await chromium.executablePath();
  const browser = await playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });

  try {
    const context = await browser.newContext();
    const cookies = parseCookies(request.headers.get("cookie") ?? "");
    if (cookies.length > 0) {
      await context.addCookies(
        cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          url: `${origin}/admin`,
        })),
      );
    }

    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle", timeout: 30_000 });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "0.55in", right: "0.55in", bottom: "0.55in", left: "0.55in" },
    });

    let filename = "cv.pdf";
    if (snapshotId) {
      const snapshot = await getCvSnapshotById(snapshotId);
      if (snapshot) filename = safeFilename(snapshot.company, snapshot.position);
    } else {
      const cv = await getCvSettings();
      const content = await resolveLiveCv(cv.locale);
      await createCvSnapshot(cv, content);
      filename = safeFilename(cv.company, cv.position);
    }

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}
