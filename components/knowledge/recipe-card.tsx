import Link from "next/link";

import type { KnowledgeDoc } from "@/lib/knowledge/types";
import { CategoryIcon } from "./category-icon";
import { StageBadge } from "./stage-badge";

// Mirrors the batch-card visual language: hairline card, category stripe,
// icon tile, title + meta. Tapping opens the recipe.
export function RecipeCard({ doc }: { doc: KnowledgeDoc }) {
  return (
    <Link
      href={`/knowledge/${doc.id}`}
      className="flex items-stretch overflow-hidden rounded-[var(--radius-card)] border-2 border-hairline bg-card transition-colors hover:border-border hover:bg-subtle-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden className="w-1.5 shrink-0 bg-accent" />
      <span className="m-2 flex size-[52px] shrink-0 items-center justify-center rounded-lg bg-subtle-fill">
        <CategoryIcon category={doc.category} id={doc.id} className="size-6 text-accent" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-2">
        <div className="flex items-baseline gap-1.5">
          <p className="truncate text-base font-bold leading-tight text-ink">{doc.title}</p>
          {doc.abbr ? (
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">{doc.abbr}</span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-secondary">{doc.summary}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 py-2 pr-3">
        {doc.stage.slice(0, 2).map((s) => (
          <StageBadge key={s} stage={s} />
        ))}
      </div>
    </Link>
  );
}
