import Link from "next/link";
import { Clock } from "lucide-react";

import { CATEGORY_META, formatDate } from "@/lib/blog";
import type { BlogPostMeta } from "@/lib/blog/types";
import { CategoryIcon } from "./category-icon";

// Mirrors the Knowledge Base RecipeCard: hairline card, accent stripe, icon tile,
// title + dek, with a byline/meta footer suited to editorial content.
export function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex items-stretch overflow-hidden rounded-[var(--radius-card)] border-2 border-hairline bg-card transition-colors hover:border-border hover:bg-subtle-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden className="w-1.5 shrink-0 bg-accent" />
      <span className="m-2 flex size-[52px] shrink-0 items-center justify-center rounded-lg bg-subtle-fill">
        <CategoryIcon category={post.category} className="size-6 text-accent" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          {CATEGORY_META[post.category].label}
        </p>
        <p className="truncate text-base font-bold leading-tight text-ink">{post.title}</p>
        <p className="line-clamp-2 text-xs leading-snug text-secondary">{post.excerpt}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>{formatDate(post.date)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="size-3" aria-hidden />
            {post.readingMinutes} min read
          </span>
        </p>
      </div>
    </Link>
  );
}
