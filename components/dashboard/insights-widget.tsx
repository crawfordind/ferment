"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Flame, Sprout, TrendingUp } from "lucide-react";

import { useBatches } from "@/hooks/use-batches";
import { useRecentObservations } from "@/hooks/use-observations";
import { computeInsights, WEEK_DAYS, type InsightTemplate } from "@/lib/insights";
import { getSeedTemplate } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { Widget, StatTile } from "./widget";

const DAY = 86_400_000;
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

// Day-bucketed window start so the observations query key is stable within a day.
function weekWindowStart(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime() - (WEEK_DAYS - 1) * DAY;
}

export function InsightsWidget() {
  const windowStart = weekWindowStart();
  const batchesQuery = useBatches();
  const observationsQuery = useRecentObservations(windowStart);

  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const active = batches.filter((b) => b.status === "active");

  // Resolve each batch's stage template up front; insights.ts stays decoupled
  // from FermentType by taking a plain id → template lookup.
  const templateById = useMemo(() => {
    const map = new Map<string, InsightTemplate | null>();
    for (const b of batches) map.set(b.id, getSeedTemplate(b.type) ?? null);
    return map;
  }, [batches]);

  const insights = useMemo(
    () =>
      computeInsights({
        batches,
        observations: observationsQuery.data ?? [],
        templateFor: (b) => templateById.get(b.id) ?? null,
      }),
    [batches, observationsQuery.data, templateById],
  );

  // Nothing to reflect on yet — stay quiet rather than show empty rails.
  if (!batchesQuery.isLoading && active.length === 0) {
    return null;
  }

  const { activeDays, currentStreak, loggedThisWeek, upcomingTransitions, harvestReminders } =
    insights;

  // Labels for the trailing 7 day dots (oldest → today).
  const dayLabels = Array.from({ length: WEEK_DAYS }, (_, i) => {
    const date = new Date(windowStart + i * DAY);
    return DOW[date.getDay()];
  });

  return (
    <Widget title="Insights" icon={TrendingUp}>
      {/* Logging streak */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <StatTile
            label="Logged this week"
            value={loggedThisWeek}
            tone={loggedThisWeek > 0 ? "accent" : "default"}
          />
          <StatTile
            label="Day streak"
            value={
              <span className="inline-flex items-center gap-1">
                {currentStreak}
                {currentStreak > 0 ? (
                  <Flame className="size-4 text-[var(--status-needs-action)]" aria-hidden />
                ) : null}
              </span>
            }
          />
        </div>
        <div className="flex items-end justify-between px-1" aria-hidden>
          {activeDays.map((on, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  "size-5 rounded-full border-2 transition-colors",
                  on ? "border-accent bg-accent" : "border-hairline bg-white",
                  i === WEEK_DAYS - 1 && "ring-2 ring-accent/30",
                )}
              />
              <span className="text-[10px] font-medium text-muted">{dayLabels[i]}</span>
            </div>
          ))}
        </div>
        <p className="sr-only">
          Logged on {activeDays.filter(Boolean).length} of the last {WEEK_DAYS} days.
        </p>
      </div>

      {/* Harvest reminders — actions that are ready or overdue */}
      {harvestReminders.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Ready to harvest
          </h3>
          {harvestReminders.map((h) => (
            <Link
              key={h.batchId}
              href={`/batch/${h.batchId}`}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-card)] border-2 px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                h.overdue
                  ? "border-[var(--status-needs-action)] bg-[color-mix(in_srgb,var(--status-needs-action)_12%,white)]"
                  : "border-accent bg-subtle-fill hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--subtle-fill))]",
              )}
            >
              <Sprout className="size-4 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                {h.batchName}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-[var(--radius-chip)] px-2 py-0.5 text-xs font-semibold",
                  h.overdue
                    ? "bg-white text-[var(--status-needs-action-text)]"
                    : "bg-white text-accent",
                )}
              >
                {h.overdue ? `${h.actionLabel} — overdue` : h.actionLabel}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Upcoming stage transitions */}
      {upcomingTransitions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Coming up
          </h3>
          {upcomingTransitions.map((t) => (
            <Link
              key={t.batchId}
              href={`/batch/${t.batchId}`}
              className="flex items-center gap-2 rounded-[var(--radius-card)] bg-subtle-fill px-3 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,var(--subtle-fill))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CalendarClock className="size-4 shrink-0 text-secondary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                <span className="font-semibold">{t.batchName}</span>
                <span className="text-secondary"> → {t.stageName}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-secondary">
                {t.inDays === 1 ? "in 1 day" : `in ${t.inDays} days`}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Encourage the first log when there's nothing scheduled yet */}
      {harvestReminders.length === 0 &&
      upcomingTransitions.length === 0 &&
      loggedThisWeek === 0 ? (
        <Link
          href="/batches"
          className="inline-flex w-fit items-center gap-1 px-1 text-xs font-semibold text-accent transition-colors hover:text-ink"
        >
          Log a check-in to start your streak
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </Widget>
  );
}
