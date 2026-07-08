"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  GraduationCap,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  CATEGORY_META,
  SECTION_META,
  SECTION_ORDER,
  STAGE_META,
  searchDocs,
} from "@/lib/knowledge";
import type {
  KbCategory,
  KbSection,
  KnowledgeDoc,
  NutritiveStage,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { RecipeCard } from "./recipe-card";

const STAGE_ORDER: NutritiveStage[] = [
  "vegetative",
  "cross-over",
  "reproductive",
  "all-stages",
  "soil",
];

// Group order for food & beverage shelves, which key off `category` rather than
// the plant-growth stages that only make sense for fertilizers.
const CATEGORY_ORDER: KbCategory[] = [
  "vegetable-ferment",
  "dairy-ferment",
  "legume-ferment",
  "grain-ferment",
  "cultured-beverage",
];

type Filter = NutritiveStage | "all";

export function KnowledgeBrowser({
  docs,
  initialSection = "fertilizer",
}: {
  docs: KnowledgeDoc[];
  initialSection?: KbSection;
}) {
  const [section, setSection] = useState<KbSection>(initialSection);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Only offer section tabs that actually have content authored.
  const sections = useMemo(
    () => SECTION_ORDER.filter((s) => docs.some((d) => d.section === s)),
    [docs],
  );

  const sectionDocs = useMemo(
    () => docs.filter((d) => d.section === section),
    [docs, section],
  );
  const featured = useMemo(
    () => sectionDocs.find((d) => d.id === "nutritive-cycle"),
    [sectionDocs],
  );
  const recipes = useMemo(
    () => sectionDocs.filter((d) => d.id !== "nutritive-cycle"),
    [sectionDocs],
  );

  const searching = query.trim().length > 0;
  const stageBrowsing = section === "fertilizer";

  const filtered = useMemo(() => {
    let list = recipes;
    if (stageBrowsing && filter !== "all")
      list = list.filter((d) => d.stage.includes(filter));
    if (searching) list = searchDocs(query, list);
    return list;
  }, [recipes, stageBrowsing, filter, query, searching]);

  // Not searching: fertilizers group by nutritive stage, everything else by category.
  const grouped = useMemo<[string, string, KnowledgeDoc[]][]>(() => {
    if (stageBrowsing) {
      const groups = new Map<NutritiveStage, KnowledgeDoc[]>();
      for (const doc of filtered) {
        const primary =
          STAGE_ORDER.find((s) => doc.stage.includes(s)) ?? doc.stage[0];
        if (!primary) continue;
        (groups.get(primary) ?? groups.set(primary, []).get(primary)!).push(
          doc,
        );
      }
      return STAGE_ORDER.filter((s) => groups.has(s)).map((s) => [
        s,
        STAGE_META[s].label,
        groups.get(s)!,
      ]);
    }
    const groups = new Map<KbCategory, KnowledgeDoc[]>();
    for (const doc of filtered) {
      (
        groups.get(doc.category) ??
        groups.set(doc.category, []).get(doc.category)!
      ).push(doc);
    }
    const order = CATEGORY_ORDER.filter((c) => groups.has(c));
    const extras = [...groups.keys()].filter((c) => !order.includes(c));
    return [...order, ...extras].map((c) => [
      c,
      CATEGORY_META[c].label,
      groups.get(c)!,
    ]);
  }, [filtered, stageBrowsing]);

  function selectSection(next: KbSection) {
    haptic();
    setSection(next);
    setFilter("all");
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter cluster — shelves, search and stage chips stay pinned under the
          top of the screen so they're always reachable while scrolling. */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-hairline bg-surface px-4 pb-3 pt-2">
        {/* Section shelves — mirrors the New Batch category step */}
        {sections.length > 1 ? (
          <div
            role="tablist"
            aria-label="Knowledge sections"
            className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sections.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={section === s}
                onClick={() => selectSection(s)}
                className={cn(
                  "min-h-tap-min shrink-0 whitespace-nowrap rounded-[var(--radius-chip)] border-2 px-4 text-sm font-semibold transition-colors",
                  section === s
                    ? "border-accent bg-subtle-fill text-ink"
                    : "border-border bg-card text-secondary hover:bg-subtle-fill",
                )}
              >
                {SECTION_META[s].label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Search leads; the plant-need filter collapses into one control beside
            it rather than a second row of chips that scrolls off-screen. */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes, nutrients, ingredients…"
              aria-label="Search the knowledge base"
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

          {stageBrowsing ? (
            <StageFilterMenu value={filter} onChange={setFilter} />
          ) : null}
        </div>
      </div>

      <p className="px-1 text-sm text-secondary">
        {SECTION_META[section].blurb}
      </p>

      {/* Featured concept card (fertilizer shelf only) */}
      {featured && !searching && filter === "all" ? (
        <Link
          href={`/knowledge/${featured.id}`}
          className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-accent bg-subtle-fill px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--subtle-fill))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <GraduationCap className="size-6 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">
              Start here — {featured.title}
            </p>
            <p className="line-clamp-1 text-xs text-secondary">
              {featured.summary}
            </p>
          </div>
        </Link>
      ) : null}

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-secondary">
          {searching ? `No recipes match “${query}”.` : "No recipes here yet."}
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
        grouped.map(([key, label, list]) => (
          <section key={key} className="flex flex-col gap-3">
            <SectionLabel>{label}</SectionLabel>
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
  return (
    <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
      {children}
    </h2>
  );
}

/**
 * Collapses the plant-need chip wall into one affordance. Closed, it shows the
 * active filter (or just "Filter"); open, it lists the stages as a menu. The
 * results are already grouped by stage, so this is a refinement, not the primary
 * way to navigate.
 */
function StageFilterMenu({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (next: Filter) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "all";
  const label = active ? STAGE_META[value].short : "Filter";

  const options: { key: Filter; label: string }[] = [
    { key: "all", label: "All stages" },
    ...STAGE_ORDER.map((s) => ({ key: s, label: STAGE_META[s].label })),
  ];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={active ? `Filter: ${label}` : "Filter by stage"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "min-h-tap-min inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-button)] border-2 px-3.5 text-sm font-semibold transition-colors",
          active
            ? "border-accent bg-subtle-fill text-ink"
            : "border-border bg-card text-secondary hover:bg-subtle-fill",
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {label}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-md"
          >
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitemradio"
                aria-checked={value === option.key}
                onClick={() => {
                  haptic();
                  onChange(option.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-tap-min w-full items-center justify-between gap-2 px-4 text-left text-sm hover:bg-subtle-fill",
                  value === option.key
                    ? "font-semibold text-ink"
                    : "text-secondary",
                )}
              >
                {option.label}
                {value === option.key ? (
                  <Check className="size-4 shrink-0 text-accent" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
