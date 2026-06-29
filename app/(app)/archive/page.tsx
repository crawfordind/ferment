"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BatchCard } from "@/components/batch/batch-card";
import { BatchCardSkeleton } from "@/components/batch/batch-card-skeleton";
import { Button } from "@/components/ui/button";
import { useAllBatches } from "@/hooks/use-batches";
import type { LocalBatch } from "@/offline/dexie";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
      {children}
    </h2>
  );
}

/** Most-recently touched first (finished/archived time, falling back to update). */
function byRecency(a: LocalBatch, b: LocalBatch) {
  return (b.finishedAt ?? b.updatedAt) - (a.finishedAt ?? a.updatedAt);
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Loading batches">
      {Array.from({ length: 3 }).map((_, index) => (
        <BatchCardSkeleton key={index} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        aria-hidden
        className="size-20 rounded-full border-2 border-dashed border-border"
      />
      <div className="space-y-1">
        <p className="text-lg font-bold text-ink">Nothing here yet</p>
        <p className="text-sm text-secondary">
          Finished and archived batches will show up here.
        </p>
      </div>
      <Button asChild variant="outline" size="lg" className="w-full max-w-xs">
        <Link href="/">Back to active</Link>
      </Button>
    </div>
  );
}

export default function ArchivePage() {
  const batchesQuery = useAllBatches();

  const all = batchesQuery.data ?? [];
  const finished = all
    .filter((batch) => batch.status === "finished")
    .sort(byRecency);
  const archived = all
    .filter((batch) => batch.status === "archived")
    .sort(byRecency);
  const isEmpty = finished.length === 0 && archived.length === 0;

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to home">
          <Link href="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-ink">Past batches</h1>
      </header>

      {batchesQuery.isLoading ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {finished.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionLabel>Finished</SectionLabel>
              {finished.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </section>
          ) : null}

          {archived.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionLabel>Archived</SectionLabel>
              {archived.map((batch) => (
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
    </main>
  );
}
