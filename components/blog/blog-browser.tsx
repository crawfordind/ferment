"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Search, Sparkles, X } from "lucide-react";

import { CATEGORY_META, CATEGORY_ORDER, formatDate, getFeaturedPost, searchPosts } from "@/lib/blog";
import type { BlogCategory, BlogPostMeta } from "@/lib/blog/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { CategoryIcon } from "./category-icon";
import { PostCard } from "./post-card";

type Filter = BlogCategory | "all";

export function BlogBrowser({ posts }: { posts: BlogPostMeta[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const searching = query.trim().length > 0;
  const browsing = !searching && filter === "all";

  // The hero leads the default view. Once you search or pick a category, it steps
  // aside so results own the screen — and the hero post rejoins the normal list.
  const featured = useMemo(() => getFeaturedPost(posts), [posts]);

  // Only offer category chips that actually have posts.
  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c) => posts.some((p) => p.category === c)),
    [posts],
  );

  const list = useMemo(() => {
    let result = posts;
    if (browsing && featured) result = result.filter((p) => p.slug !== featured.slug);
    if (filter !== "all") result = result.filter((p) => p.category === filter);
    if (searching) result = searchPosts(query, result);
    return result;
  }, [posts, browsing, featured, filter, searching, query]);

  function selectFilter(next: Filter) {
    haptic();
    setFilter(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky filter cluster — search + category chips stay reachable while scrolling. */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-hairline bg-surface px-4 pb-3 pt-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, topics, microbes…"
            aria-label="Search the blog"
            className="min-h-tap-min w-full rounded-[var(--radius-button)] border-2 border-border bg-card pl-9 pr-9 text-sm text-ink focus:border-accent focus:outline-none"
          />
          {searching ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-subtle-fill"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          role="tablist"
          aria-label="Filter by topic"
          className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <FilterChip active={filter === "all"} onClick={() => selectFilter("all")}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c} active={filter === c} onClick={() => selectFilter(c)}>
              {CATEGORY_META[c].label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Featured hero — the editor's pick, only in the default browse view. */}
      {browsing && featured ? <FeaturedHero post={featured} /> : null}

      {/* Results */}
      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-secondary">
          {searching ? `No articles match “${query}”.` : "No articles here yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {searching || filter !== "all" ? (
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
              {list.length} article{list.length === 1 ? "" : "s"}
              {filter !== "all" ? ` · ${CATEGORY_META[filter].label}` : ""}
            </h2>
          ) : (
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
              Latest
            </h2>
          )}
          {list.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "min-h-tap-min shrink-0 whitespace-nowrap rounded-[var(--radius-chip)] border-2 px-4 text-sm font-semibold transition-colors",
        active
          ? "border-accent bg-subtle-fill text-ink"
          : "border-border bg-card text-secondary hover:bg-subtle-fill",
      )}
    >
      {children}
    </button>
  );
}

function FeaturedHero({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-accent bg-subtle-fill p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--subtle-fill))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.4px] text-accent">
        <Sparkles className="size-3.5" aria-hidden />
        Featured
      </div>
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] border-2 border-ink-border bg-card">
          <CategoryIcon category={post.category} className="size-6 text-accent" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            {CATEGORY_META[post.category].label}
          </p>
          <h2 className="text-lg font-bold leading-tight text-ink">{post.title}</h2>
        </div>
      </div>
      <p className="text-sm leading-snug text-secondary">{post.excerpt}</p>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>{formatDate(post.date)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="size-3" aria-hidden />
            {post.readingMinutes} min read
          </span>
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
          Read
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
