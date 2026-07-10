import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, Clock, User } from "lucide-react";

import { CATEGORY_META, formatDate, getAllPosts, getPost } from "@/lib/blog";
import { CategoryIcon } from "@/components/blog/category-icon";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return { title: "Article" };
  }
  const canonical = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // A couple of fresh reads to keep going — same category first, then newest.
  const more = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 2);

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <Link
        href="/blog"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Blog
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-subtle-fill">
            <CategoryIcon category={post.category} className="size-5 text-accent" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            {CATEGORY_META[post.category].label}
          </span>
        </div>

        <h1 className="text-2xl font-bold leading-tight text-ink">{post.title}</h1>
        <p className="text-base leading-snug text-secondary">{post.excerpt}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-hairline py-2.5 text-xs text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-3.5 text-muted" aria-hidden />
            <span className="font-semibold text-ink">{post.author}</span>
          </span>
          <span aria-hidden className="text-hairline">|</span>
          <span>{formatDate(post.date)}</span>
          <span aria-hidden className="text-hairline">|</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 text-muted" aria-hidden />
            {post.readingMinutes} min read
          </span>
          {post.updated ? (
            <>
              <span aria-hidden className="text-hairline">|</span>
              <span>Updated {formatDate(post.updated)}</span>
            </>
          ) : null}
        </div>
      </header>

      {/* Article body — shares the Knowledge Base's prose styles (dark-mode aware). */}
      <article className="kb-prose" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

      {/* Tags */}
      {post.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-hairline pt-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[var(--radius-chip)] bg-subtle-fill px-2.5 py-1 text-xs font-medium text-secondary"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Keep reading */}
      {more.length > 0 ? (
        <section className="flex flex-col gap-2 border-t border-hairline pt-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">Keep reading</h2>
          <div className="flex flex-col gap-2">
            {more.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-hairline bg-card px-3 py-2.5 transition-colors hover:border-border hover:bg-subtle-fill"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-subtle-fill">
                  <CategoryIcon category={p.category} className="size-5 text-accent" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{p.title}</span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
