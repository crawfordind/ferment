import { getAllDocs } from "@/lib/knowledge";
import type { KbSection } from "@/lib/knowledge/types";
import { KnowledgeBrowser } from "@/components/knowledge/knowledge-browser";
import { LearnTabs } from "@/components/blog/learn-tabs";

export const metadata = {
  title: "Knowledge Base · Ferment",
};

const SECTIONS: KbSection[] = ["fertilizer", "food", "beverage"];

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  // Slim the payload for the client: the list/search needs everything except the
  // rendered article HTML, which only the detail page uses.
  const docs = getAllDocs().map((d) => ({ ...d, bodyHtml: "" }));

  // Let other surfaces (e.g. the dashboard's Learn widget) deep-link a shelf.
  const requested = (await searchParams).section;
  const initialSection = SECTIONS.find((s) => s === requested) ?? "fertilizer";

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <LearnTabs />
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink">Knowledge Base</h1>
        <p className="text-sm text-secondary">
          Recipes and the science behind them — split into Fertilizers, Food, and Beverage.
        </p>
      </header>
      <KnowledgeBrowser docs={docs} initialSection={initialSection} />
    </main>
  );
}
