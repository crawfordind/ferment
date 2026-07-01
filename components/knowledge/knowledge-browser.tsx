"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, Search, X } from "lucide-react";

import { STAGE_META, searchDocs } from "@/lib/knowledge";
import type { KnowledgeDoc, NutritiveStage } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { RecipeCard } from "./recipe-card";

const STAGE_ORDER: NutritiveStage[] = ["vegetative", "cross-over", "reproductive", "all-stages", "soil"];

type Filter = NutritiveStage | "all";

export function KnowledgeBrowser({ docs }: { docs: KnowledgeDoc[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const featured = useMemo(() => docs.find((d) => d.id === "nutritive-cycle"), [docs]);
  const recipes = useMemo(() => docs.filter((d) => d.id !== "nutritive-cycle"), [docs]);

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    let list = recipes;
    if (filter !== "all") list = list.filter((d) => d.stage.includes(filter));
    if (searching) list = searchDocs(query, list);
    return list;
  }, [recipes, filter, query, searching]);

  // When not searching, group by the doc's primary (first) stage.
  const grouped = useMemo(() => {
    const groups = new Map<NutritiveStage, KnowledgeDoc[]>();
    for (const doc of filtered) {
      const primary = STAGE_ORDER.find((s) => doc.stage.includes(s)) ?? doc.stage[0];
      const bucket = groups.get(primary) ?? [];
      bucket.push(doc);
      groups.set(primary, bucket);
    }
    return STAGE_ORDER.filter((s) => groups.has(s)).map((s) => [s, groups.get(s)!] as const);
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes, nutrients, ingredients…"
          aria-label="Search the knowledge base"
          className="min-h-tap-min w-full rounded-[var(--radius-button)] border-2 border-border bg-white pl-9 pr-9 text-sm text-ink focus:border-accent focus:outline-none"
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

      {/* Stage filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterChip>
        {STAGE_ORDER.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {STAGE_META[s].short}
          </FilterChip>
        ))}
      </div>

      {/* Featured concept card */}
      {featured && !searching && filter === "all" ? (
        <Link
          href={`/knowledge/${featured.id}`}
          className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-accent bg-subtle-fill px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--subtle-fill))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <GraduationCap className="size-6 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Start here — {featured.title}</p>
            <p className="line-clamp-1 text-xs text-secondary">{featured.summary}</p>
          </div>
        </Link>
      ) : null}

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-secondary">
          No recipes match “{query}”.
        </p>
      ) : searching ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </SectionLabel>
          {filtered.map((doc) => (
            <RecipeCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        grouped.map(([stage, list]) => (
          <section key={stage} className="flex flex-col gap-3">
            <SectionLabel>{STAGE_META[stage].label}</SectionLabel>
            {list.map((doc) => (
              <RecipeCard key={doc.id} doc={doc} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">{children}</h2>;
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
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-[36px] shrink-0 whitespace-nowrap rounded-[var(--radius-chip)] border-2 px-3 text-sm font-semibold transition-colors",
        active ? "border-accent bg-subtle-fill text-ink" : "border-border bg-white text-secondary hover:bg-subtle-fill",
      )}
    >
      {children}
    </button>
  );
}
