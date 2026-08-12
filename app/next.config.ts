import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  experimental: {
    // The root layout lives at app/[lang]/layout.tsx (a top-level dynamic segment),
    // so there's no single layout.js Next can compose a 404 page from — see
    // app/global-not-found.tsx and docs/arch/11-i18n.md.
    globalNotFound: true,
  },
};

export default nextConfig;
