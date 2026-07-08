"use client";

import { useMemo } from "react";

import { useBatches } from "@/hooks/use-batches";
import { useRecentObservations } from "@/hooks/use-observations";
import { computeAttention, type Attention } from "@/lib/attention";
import {
  computeInsights,
  WEEK_DAYS,
  type Insights,
  type InsightTemplate,
} from "@/lib/insights";
import { getSeedTemplate } from "@/lib/seed-data";
import type { LocalBatch } from "@/offline/dexie";

const DAY = 86_400_000;

// Day-bucketed window start so the observations query key stays stable within a
// calendar day (matches the Insights widget's window).
function weekWindowStart(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime() - (WEEK_DAYS - 1) * DAY;
}

export type ScoredBatch = { batch: LocalBatch; attention: Attention };

export type NextCheckIn = {
  batchId: string;
  batchName: string;
  /** Human phrase for when it's due, e.g. "tomorrow", "in 3 days". */
  when: string;
  /** What's coming, e.g. the next stage name. */
  detail: string;
};

export type HomeSummary = {
  isLoading: boolean;
  hasError: boolean;
  /** Active batches only. */
  active: LocalBatch[];
  /** Active batches that need attention today, most urgent first. */
  attention: ScoredBatch[];
  /** All active batches, attention-sorted (attention first, then the rest). */
  scored: ScoredBatch[];
  allOnTrack: boolean;
  /** The soonest upcoming check-in when nothing is overdue, else null. */
  nextCheckIn: NextCheckIn | null;
  insights: Insights;
};

const EMPTY_INSIGHTS: Insights = {
  loggedThisWeek: 0,
  activeDays: Array.from({ length: WEEK_DAYS }, () => false),
  currentStreak: 0,
  upcomingTransitions: [],
  harvestReminders: [],
};

function whenPhrase(inDays: number): string {
  if (inDays <= 0) return "today";
  if (inDays === 1) return "tomorrow";
  return `in ${inDays} days`;
}

/**
 * One source of truth for the home screen's triage: what needs attention, what's
 * coming next, and the week's logging rhythm. Centralised so the hero, the
 * ferments list, and the ambient insight all agree without re-deriving.
 */
export function useHomeSummary(): HomeSummary {
  const windowStart = weekWindowStart();
  const batchesQuery = useBatches();
  const observationsQuery = useRecentObservations(windowStart);

  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);

  return useMemo(() => {
    const active = batches.filter((b) => b.status === "active");

    const scored: ScoredBatch[] = active
      .map((batch) => ({
        batch,
        attention: computeAttention(batch, getSeedTemplate(batch.type) ?? null),
      }))
      .sort((a, b) => b.attention.priority - a.attention.priority);

    const attention = scored.filter((s) => s.attention.needsAttention);

    const templateById = new Map<string, InsightTemplate | null>();
    for (const b of batches)
      templateById.set(b.id, getSeedTemplate(b.type) ?? null);

    const insights = computeInsights({
      batches,
      observations: observationsQuery.data ?? [],
      templateFor: (b) => templateById.get(b.id) ?? null,
    });

    const upcoming = insights.upcomingTransitions[0] ?? null;
    const nextCheckIn: NextCheckIn | null = upcoming
      ? {
          batchId: upcoming.batchId,
          batchName: upcoming.batchName,
          when: whenPhrase(upcoming.inDays),
          detail: upcoming.stageName,
        }
      : null;

    return {
      isLoading: batchesQuery.isLoading,
      hasError: Boolean(batchesQuery.error),
      active,
      attention,
      scored,
      allOnTrack: attention.length === 0,
      nextCheckIn,
      insights,
    };
  }, [
    batches,
    observationsQuery.data,
    batchesQuery.isLoading,
    batchesQuery.error,
  ]);
}

export { EMPTY_INSIGHTS };
