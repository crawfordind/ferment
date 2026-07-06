"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BatchCard } from "@/components/batch/batch-card";
import { BatchCardSkeleton } from "@/components/batch/batch-card-skeleton";
import { Button } from "@/components/ui/button";
import { useBatches } from "@/hooks/use-batches";
import { computeAttention } from "@/lib/attention";
import { getSeedTemplate } from "@/lib/seed-data";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
      {children}
    </h2>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
      <div
        aria-hidden
        className="size-28 rounded-full border-2 border-dashed border-border"
      />
      <div className="space-y-1">
        <p className="text-lg font-bold text-ink">No batches yet</p>
        <p className="text-sm text-secondary">
          Start a ferment to begin logging in the field.
        </p>
      </div>
      <Button asChild size="lg" className="w-full max-w-xs">
        <Link href="/new">＋ Start your first batch</Link>
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Loading batches">
      {Array.from({ length: 4 }).map((_, index) => (
        <BatchCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function BatchesPage() {
  const batchesQuery = useBatches();

  const active = (batchesQuery.data ?? []).filter(
    (batch) => batch.status === "active",
  );
  const scored = active.map((batch) => ({
    batch,
    attention: computeAttention(batch, getSeedTemplate(batch.type) ?? null),
  }));
  const attention = scored
    .filter((item) => item.attention.needsAttention)
    .sort((a, b) => b.attention.priority - a.attention.priority);
  const allActive = scored.filter((item) => !item.attention.needsAttention);

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Dashboard
      </Link>

      <h1 className="text-xl font-bold text-ink">Ferments</h1>

      {batchesQuery.isLoading ? (
        <LoadingState />
      ) : active.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {attention.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div className="rounded-[var(--radius-card)] bg-subtle-fill px-4 py-3 text-sm font-medium text-secondary">
                {attention.length === 1
                  ? "1 batch needs attention today"
                  : `${attention.length} batches need attention today`}
              </div>
              <SectionLabel>Needs attention</SectionLabel>
              {attention.map(({ batch, attention: info }) => (
                <BatchCard key={batch.id} batch={batch} hint={info.hint} />
              ))}
            </section>
          ) : (
            <p className="px-1 text-sm text-secondary">
              All caught up for today.
            </p>
          )}

          {allActive.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionLabel>All active</SectionLabel>
              {allActive.map(({ batch }) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </section>
          ) : null}
        </>
      )}

      {batchesQuery.error ? (
        <p className="text-sm text-status-needs-action-text" role="alert">
          Could not load batches. Showing what is saved on this device.
        </p>
      ) : null}

      {!batchesQuery.isLoading ? (
        <Link
          href="/archive"
          className="mt-auto inline-flex items-center justify-between gap-1 rounded-[var(--radius-card)] px-1 py-2 text-sm font-semibold text-secondary transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Finished &amp; archived batches
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </main>
  );
}
