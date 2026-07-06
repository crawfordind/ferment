import Link from "next/link";
import { BookOpen, CupSoda, GraduationCap, Leaf, Utensils, type LucideIcon } from "lucide-react";

import { getAllDocs, SECTION_META, SECTION_ORDER } from "@/lib/knowledge";
import type { KbSection } from "@/lib/knowledge/types";
import { Widget } from "./widget";

const SECTION_ICONS: Record<KbSection, LucideIcon> = {
  fertilizer: Leaf,
  food: Utensils,
  beverage: CupSoda,
};

/**
 * Static (server-rendered) module surfacing the Knowledge Base shelves with
 * live counts, plus the "Start here" concept as a featured entry point.
 */
export function LearningWidget() {
  const docs = getAllDocs();
  const featured = docs.find((d) => d.id === "nutritive-cycle");
  const counts = SECTION_ORDER.map((section) => ({
    section,
    count: docs.filter((d) => d.section === section).length,
  })).filter((s) => s.count > 0);

  return (
    <Widget title="Learn" icon={BookOpen} action={{ href: "/knowledge", label: "Browse" }}>
      {featured ? (
        <Link
          href={`/knowledge/${featured.id}`}
          className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-accent bg-subtle-fill px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--subtle-fill))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <GraduationCap className="size-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Start here — {featured.title}</p>
            <p className="line-clamp-1 text-xs text-secondary">{featured.summary}</p>
          </div>
        </Link>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {counts.map(({ section, count }) => {
          const Icon = SECTION_ICONS[section];
          return (
            <Link
              key={section}
              href={`/knowledge?section=${section}`}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-card)] bg-subtle-fill px-2 py-3 text-center transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--subtle-fill))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon className="size-5 text-accent" aria-hidden />
              <span className="text-xs font-semibold leading-tight text-ink">
                {SECTION_META[section].label}
              </span>
              <span className="text-[11px] text-muted">
                {count} {count === 1 ? "recipe" : "recipes"}
              </span>
            </Link>
          );
        })}
      </div>
    </Widget>
  );
}
