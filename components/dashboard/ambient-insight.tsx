"use client";

import { TrendingUp } from "lucide-react";

import { computeBatchProgress } from "@/lib/progress";
import { getSeedTemplate } from "@/lib/seed-data";
import { WEEK_DAYS } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { HomeSummary } from "@/hooks/use-home-summary";

const DAY = 86_400_000;
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The ambient tier's craft signal — what replaced the vanity streak. It leads
 * with something a fermenter actually cares about (what's ready, how much
 * they've logged) and keeps the 7-day rhythm as a calm cadence, never a streak
 * you can "break".
 */
export function AmbientInsight({ summary }: { summary: HomeSummary }) {
  if (summary.isLoading || summary.active.length === 0) return null;

  const now = Date.now();
  const soon = now + WEEK_DAYS * DAY;

  // "Ready this week" — batches at or past their estimated ready date within the
  // coming week. A real craft milestone, not a habit-app counter.
  const readyThisWeek = summary.active.filter((b) => {
    const { readyAt } = computeBatchProgress(b, getSeedTemplate(b.type), now);
    return readyAt != null && readyAt <= soon;
  }).length;

  const { loggedThisWeek, activeDays } = summary.insights;

  const parts: string[] = [];
  if (readyThisWeek > 0) {
    parts.push(
      `${readyThisWeek} batch${readyThisWeek === 1 ? "" : "es"} ready this week`,
    );
  }
  parts.push(
    `${loggedThisWeek} log${loggedThisWeek === 1 ? "" : "s"} in the last 7 days`,
  );

  // Day letters for the trailing week, oldest → today.
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const windowStart = todayStart.getTime() - (WEEK_DAYS - 1) * DAY;
  const dayLabels = Array.from(
    { length: WEEK_DAYS },
    (_, i) => DOW[new Date(windowStart + i * DAY).getDay()],
  );

  return (
    <section className="flex flex-col gap-2.5 px-1 pt-1">
      <p className="flex items-center gap-2 text-[13px] font-medium text-secondary">
        <TrendingUp className="size-4 shrink-0 text-muted" aria-hidden />
        <span>
          {parts.map((part, i) => (
            <span key={i}>
              {i > 0 ? <span className="text-muted"> · </span> : null}
              {i === 0 && readyThisWeek > 0 ? (
                <span className="font-semibold text-ink">{part}</span>
              ) : (
                part
              )}
            </span>
          ))}
        </span>
      </p>

      {/* Gentle weekly rhythm — a filled dot for each day you logged. */}
      <div className="flex items-end gap-2 px-0.5" aria-hidden>
        {activeDays.map((on, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "size-2.5 rounded-full",
                on ? "bg-accent" : "bg-hairline",
                i === WEEK_DAYS - 1 && "ring-2 ring-accent/25",
              )}
            />
            <span className="text-[9px] font-medium text-muted">
              {dayLabels[i]}
            </span>
          </div>
        ))}
      </div>
      <p className="sr-only">
        Logged on {activeDays.filter(Boolean).length} of the last {WEEK_DAYS}{" "}
        days.
      </p>
    </section>
  );
}
