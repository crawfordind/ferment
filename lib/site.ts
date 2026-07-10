/**
 * Canonical public origin for SEO — sitemap URLs, robots, `metadataBase`, and
 * canonical <link> tags. Defaults to the `www` host because the apex
 * 308-redirects to it, so emitting the apex would make every indexed URL a
 * redirect. Override with NEXT_PUBLIC_SITE_URL if the canonical host changes.
 *
 * Kept separate from APP_BASE_URL (which builds auth magic-link URLs) so the
 * public canonical host is correct-by-default without depending on that value.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.myferment.com"
)
  .trim()
  .replace(/\/+$/, "");
