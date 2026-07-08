"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sprout } from "lucide-react";

import { PhotoThumb } from "@/components/batch/photo-thumb";
import { StatusIndicator } from "@/components/batch/status-indicator";
import { Button } from "@/components/ui/button";
import { batchInitials } from "@/lib/ferment-visuals";
import type { HomeSummary } from "@/hooks/use-home-summary";

// The single most prominent element on Home. It adapts to what the day needs:
// when a batch wants you, it surfaces that batch and a one-tap way to resolve it;
// when nothing does, it collapses to a warm "all caught up" line. Either way it
// owns the top of the screen — the old dead "0 need attention" counter is gone.

export function TriageHero({ summary }: { summary: HomeSummary }) {
  if (summary.isLoading) {
    return (
      <div
        className="h-[104px] animate-pulse rounded-[var(--radius-card)] bg-subtle-fill"
        aria-hidden
      />
    );
  }

  if (summary.active.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-hairline bg-card px-4 py-6 text-center">
        <Sprout className="size-7 text-accent" aria-hidden />
        <div className="space-y-0.5">
          <p className="text-base font-bold text-ink">
            Start your first ferment
          </p>
          <p className="text-sm text-secondary">
            Log a batch to begin tracking it in the field.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/new">＋ Start a batch</Link>
        </Button>
      </section>
    );
  }

  // Something needs you — hero the most urgent batch + a one-tap action.
  const top = summary.attention[0];
  if (top) {
    const { batch, attention } = top;
    const more = summary.attention.length - 1;
    return (
      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-ink-border bg-card p-3 shadow-[var(--shadow-md)]">
        <Link
          href={`/batch/${batch.id}`}
          className="flex items-center gap-3 rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <PhotoThumb
            photoId={batch.thumbnailPhotoId}
            className="size-14 shrink-0 rounded-lg"
            label={batchInitials(batch.name, batch.code)}
            type={batch.type}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-status-needs-action-text">
              Needs a check-in
            </p>
            <p className="truncate text-base font-bold leading-tight text-ink">
              {batch.name}
            </p>
            {attention.hint ? (
              <p className="truncate text-xs font-medium text-secondary">
                {attention.hint}
              </p>
            ) : null}
          </div>
          <StatusIndicator
            health={batch.health}
            showLabel={false}
            className="shrink-0 self-start pt-1"
          />
        </Link>

        <Button asChild size="lg" className="w-full">
          <Link href={`/batch/${batch.id}/log`}>Log check-in</Link>
        </Button>

        {more > 0 ? (
          <Link
            href="/batches"
            className="inline-flex w-fit items-center gap-1 self-center px-1 text-xs font-semibold text-secondary transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {more === 1
              ? "1 more needs attention"
              : `${more} more need attention`}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </section>
    );
  }

  // All caught up — a calm confirmation + what's next.
  const next = summary.nextCheckIn;
  return (
    <section className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-hairline bg-subtle-fill p-4 shadow-[var(--shadow-sm)]">
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))]"
      >
        <CheckCircle2 className="size-6 text-accent" />
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold text-ink">All caught up for today</p>
        <p className="text-sm text-secondary">
          {next ? (
            <>
              Next check-in:{" "}
              <span className="font-semibold text-ink">{next.batchName}</span> —{" "}
              {next.detail} {next.when}
            </>
          ) : (
            "Log a photo anytime to build a visual history."
          )}
        </p>
      </div>
    </section>
  );
}
