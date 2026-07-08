"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { BatchCard } from "@/components/batch/batch-card";
import type { HomeSummary } from "@/hooks/use-home-summary";

// How many batches to preview on Home before deferring to the full list. Kept
// small so the primary tier stays scannable on a phone.
const MAX_PREVIEW = 3;

/**
 * The primary tier of Home: the user's own batches as canonical BatchCards,
 * attention-sorted. A borderless section — whitespace, not a box, sets it apart
 * from the hero above and the ambient rows below.
 */
export function YourFerments({ summary }: { summary: HomeSummary }) {
  // The empty and loading states are owned by the hero; stay quiet here.
  if (summary.isLoading || summary.active.length === 0) return null;

  const preview = summary.scored.slice(0, MAX_PREVIEW);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          Your ferments
          <span className="rounded-[var(--radius-chip)] bg-subtle-fill px-2 py-0.5 text-[11px] font-semibold text-secondary">
            {summary.active.length} going
          </span>
        </h2>
        <Link
          href="/batches"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-[var(--radius-chip)] px-1 text-xs font-semibold text-accent transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View all
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {preview.map(({ batch, attention }) => (
          <BatchCard key={batch.id} batch={batch} hint={attention.hint} />
        ))}
      </div>

      {summary.hasError ? (
        <p className="px-1 text-xs text-status-needs-action-text" role="alert">
          Showing what is saved on this device.
        </p>
      ) : null}
    </section>
  );
}
