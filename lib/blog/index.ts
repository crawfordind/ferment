import { BLOG_POSTS } from "./generated";
import type { BlogCategory, BlogPost, BlogPostMeta } from "./types";

export type { BlogCategory, BlogPost, BlogPostMeta } from "./types";

/** Human labels + short blurbs for each editorial section, in display order. */
export const CATEGORY_META: Record<BlogCategory, { label: string; order: number; blurb: string }> = {
  science: { label: "The Science", order: 1, blurb: "The chemistry and biochemistry behind the ferment." },
  microbiology: { label: "Microbes", order: 2, blurb: "The organisms doing the work — and how they cooperate." },
  safety: { label: "Safety", order: 3, blurb: "pH, pathogens, spoilage, and fermenting with confidence." },
  health: { label: "Health & Nutrition", order: 4, blurb: "What the research says about ferments and the body." },
  history: { label: "History & Culture", order: 5, blurb: "Where our ferments come from and why they endure." },
  guide: { label: "Deep-Dive Guides", order: 6, blurb: "Longer, researched walkthroughs of a technique." },
};

export const CATEGORY_ORDER: BlogCategory[] = (Object.keys(CATEGORY_META) as BlogCategory[]).sort(
  (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order,
);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Format an ISO `YYYY-MM-DD` date deterministically (no `Date`/locale/timezone),
 * so server and client render identical strings and hydration never mismatches.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** The hero for the blog landing: newest editor's pick, else the newest post. */
export function getFeaturedPost<T extends BlogPostMeta>(posts: T[]): T | undefined {
  return posts.find((p) => p.featured) ?? posts[0];
}

/** Lightweight ranked search over the pre-built haystack. No deps, runs offline. */
export function searchPosts<T extends BlogPostMeta>(query: string, posts: T[] = BLOG_POSTS as unknown as T[]): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return posts;
  const terms = q.split(/\s+/);
  return posts
    .map((post) => {
      let score = 0;
      for (const term of terms) {
        const inTitle = post.title.toLowerCase().includes(term);
        const inHaystack = post.searchText.includes(term);
        if (inTitle) score += 10;
        else if (inHaystack) score += 1;
        else return null; // every term must match somewhere
      }
      return { post, score };
    })
    .filter((r): r is { post: T; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.post);
}
