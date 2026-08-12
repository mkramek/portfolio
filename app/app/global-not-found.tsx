import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import "./globals.css";

// Handles URLs that don't match any route at all — e.g. a locale segment outside the
// catalogue, or a stray path proxy.ts's matcher exclusions let through untouched.
// Bypasses app/[lang]/layout.tsx entirely (see the `globalNotFound` guide linked from
// next.config.ts), so it brings its own <html>/<body> and can't read the visitor's
// locale — there's no route to derive it from. English is the only honest default here.
export const metadata: Metadata = {
  title: "Not found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] px-6 font-mono text-[#1a1a1a]">
        <p className="text-xs uppercase tracking-widest text-[#8a8a8a]">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Not found</h1>
        <p className="mt-4 max-w-md text-center text-sm text-[#8a8a8a]">
          The page you are looking for does not exist.
        </p>
        <a href={`/${DEFAULT_LOCALE}`} className="mt-6 text-sm underline">
          Go to the homepage
        </a>
      </body>
    </html>
  );
}
