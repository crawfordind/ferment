// Blog types. Like the Knowledge Base, this is STATIC editorial content — it never
// touches the batch DB, Dexie, or the outbox. Posts are researched and written
// OUTSIDE the app as portable `.md` files in `content/blog/`, then compiled at build
// time into `generated.ts` (see `scripts/build-blog.ts`), so the whole blog ships
// bundled and reads fully offline: no runtime markdown parsing, no network, no CMS.

/**
 * Editorial section a post belongs to. Chosen to fit a fermentation-science blog;
 * each maps to an icon + human label in `lib/blog/index.ts`.
 */
export type BlogCategory =
  | "science" // the chemistry & biochemistry of a ferment
  | "microbiology" // the organisms doing the work
  | "safety" // pH, pathogens, spoilage, doing it safely
  | "health" // nutrition, gut health, what the research says
  | "history" // tradition, culture, where a ferment comes from
  | "guide"; // longer researched how-to deep-dives

export type BlogPost = {
  slug: string;
  title: string;
  /** One- or two-sentence dek shown on cards and at the top of the article. */
  excerpt: string;
  author: string;
  /** Publish date, ISO `YYYY-MM-DD`. Drives sort order (newest first). */
  date: string;
  /** Optional last-updated date, ISO `YYYY-MM-DD`. */
  updated?: string;
  category: BlogCategory;
  tags: string[];
  /** Editor's pick — surfaces as the hero on the blog landing. */
  featured: boolean;
  /** Estimated read time in minutes, computed from the body at build time. */
  readingMinutes: number;
  /** Markdown body pre-rendered to HTML at build time. */
  bodyHtml: string;
  /** Lowercased haystack for instant, dependency-free client-side search. */
  searchText: string;
};

/** The list/search payload — everything except the heavy rendered article HTML. */
export type BlogPostMeta = Omit<BlogPost, "bodyHtml">;
