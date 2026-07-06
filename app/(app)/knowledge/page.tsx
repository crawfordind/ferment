import { getAllDocs } from "@/lib/knowledge";
import { KnowledgeBrowser } from "@/components/knowledge/knowledge-browser";

export const metadata = {
  title: "Knowledge Base · Ferment",
};

export default function KnowledgePage() {
  // Slim the payload for the client: the list/search needs everything except the
  // rendered article HTML, which only the detail page uses.
  const docs = getAllDocs().map((d) => ({ ...d, bodyHtml: "" }));

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink">Knowledge Base</h1>
        <p className="text-sm text-secondary">
          Recipes and the science behind them — split into Fertilizers, Food, and Beverage.
        </p>
      </header>
      <KnowledgeBrowser docs={docs} />
    </main>
  );
}
