import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/blog";
import { getAllDocs } from "@/lib/knowledge";

/**
 * Canonical origin for indexable URLs. The apex 308-redirects to `www`, so the
 * sitemap must emit the `www` host to avoid redirect warnings in Search Console.
 * Overridable via APP_BASE_URL (set that to the same canonical host).
 */
const SITE_URL = (process.env.APP_BASE_URL || "https://www.myferment.com")
  .trim()
  .replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/knowledge`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const docs: MetadataRoute.Sitemap = getAllDocs().map((doc) => ({
    url: `${SITE_URL}/knowledge/${doc.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...posts, ...docs];
}
