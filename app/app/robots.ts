import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Every locale's admin tree and the API are private — /*/admin matches
      // /en/admin, /pl/admin, etc. regardless of which locale segment comes first.
      disallow: ["/*/admin", "/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
