import { getAllPosts } from "@/lib/blog";
import { LearnTabs } from "@/components/blog/learn-tabs";
import { BlogBrowser } from "@/components/blog/blog-browser";

export const metadata = {
  title: "Blog · Ferment",
};

export default function BlogPage() {
  // Slim the payload for the client: the list/search needs everything except the
  // rendered article HTML, which only the detail page uses.
  const posts = getAllPosts().map((p) => ({ ...p, bodyHtml: "" }));

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <LearnTabs />
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink">Blog</h1>
        <p className="text-sm text-secondary">
          Researched deep-dives on the science, microbiology, and history of fermentation.
        </p>
      </header>
      <BlogBrowser posts={posts} />
    </main>
  );
}
