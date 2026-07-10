import type { MetadataRoute } from "next";

const SITE_URL = (process.env.APP_BASE_URL || "https://www.myferment.com")
  .trim()
  .replace(/\/+$/, "");

/**
 * Allow crawling of the public content; keep the API and the gated app areas
 * (dashboard + batch data) out of the index. Points crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog", "/knowledge", "/login"],
      disallow: ["/api/", "/batch/", "/batches", "/new", "/archive", "/settings", "/debug"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
