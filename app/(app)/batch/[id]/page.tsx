"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { ObservationRow } from "@/components/batch/observation-row";
import { PhotoThumb } from "@/components/batch/photo-thumb";
import { StageBanner } from "@/components/batch/stage-banner";
import { StatusIndicator } from "@/components/batch/status-indicator";
import { DayChip } from "@/components/batch/day-chip";
import { Button } from "@/components/ui/button";
import { useBatch, useUpdateBatch } from "@/hooks/use-batch";
import { useObservations } from "@/hooks/use-observations";
import { computeDayInProcess } from "@/lib/day";
import { getSeedTemplate } from "@/lib/seed-data";
import { currentStage } from "@/lib/stages";

function OverflowMenu({ batchId }: { batchId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const batchQuery = useBatch(batchId);
  const updateBatch = useUpdateBatch(batchId);
  const status = batchQuery.data?.status;

  async function apply(patch: Parameters<typeof updateBatch.mutateAsync>[0]) {
    setOpen(false);
    await updateBatch.mutateAsync(patch);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Batch actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="size-5" />
      </Button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-[var(--radius-card)] border border-border bg-white shadow-md"
          >
            {status === "active" ? (
              <>
                <button
                  role="menuitem"
                  className="flex min-h-tap-min w-full items-center px-4 text-left text-sm text-ink hover:bg-subtle-fill"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/batch/${batchId}/edit`);
                  }}
                >
                  Edit batch
                </button>
                <button
                  role="menuitem"
                  className="flex min-h-tap-min w-full items-center px-4 text-left text-sm text-ink hover:bg-subtle-fill"
                  onClick={() =>
                    apply({ status: "finished", finishedAt: Date.now() })
                  }
                >
                  Finish batch
                </button>
                <button
                  role="menuitem"
                  className="flex min-h-tap-min w-full items-center px-4 text-left text-sm text-ink hover:bg-subtle-fill"
                  onClick={() => apply({ status: "archived" })}
                >
                  Archive batch
                </button>
              </>
            ) : (
              <>
                <button
                  role="menuitem"
                  className="flex min-h-tap-min w-full items-center px-4 text-left text-sm text-ink hover:bg-subtle-fill"
                  onClick={() => apply({ status: "active", finishedAt: null })}
                >
                  Reopen batch
                </button>
                <button
                  role="menuitem"
                  className="flex min-h-tap-min w-full items-center px-4 text-left text-sm text-ink hover:bg-subtle-fill"
                  onClick={() => {
                    setOpen(false);
                    router.push("/");
                  }}
                >
                  Back to home
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const batchId = params.id;
  const batchQuery = useBatch(batchId);
  const observationsQuery = useObservations(batchId);

  if (batchQuery.isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-subtle-fill" />
        <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-subtle-fill" />
      </main>
    );
  }

  if (batchQuery.error || !batchQuery.data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6 text-center">
        <p className="text-ink">This batch could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    );
  }

  const batch = batchQuery.data;
  const template = getSeedTemplate(batch.type);
  const day = computeDayInProcess(batch.startedAt);
  const observations = observationsQuery.data ?? [];
  const finished = batch.status !== "active";

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      {/* Header */}
      <header className="overflow-hidden rounded-[var(--radius-card)] border-2 border-ink-border bg-white">
        <div className="relative">
          <PhotoThumb
            photoId={batch.thumbnailPhotoId}
            className="h-40 w-full rounded-none border-0"
            grayscale={finished}
          />
          <div className="absolute right-2 top-2">
            <OverflowMenu batchId={batchId} />
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-ink">
              {batch.name}
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {batch.code}
              {batch.sizeValue
                ? ` · ${batch.sizeValue} ${batch.sizeUnit ?? ""}`.trimEnd()
                : ""}
            </p>
            {finished ? (
              <p className="mt-1 text-xs font-semibold text-secondary">
                {batch.status === "finished" ? "Finished" : "Archived"} · Day{" "}
                {day}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <DayChip day={day} />
            <StatusIndicator health={batch.health} />
          </div>
        </div>
      </header>

      {/* Stage banner */}
      {template && !finished ? (
        <StageBanner stage={currentStage(batch, template)} />
      ) : null}

      {/* Timeline */}
      <section className="flex flex-col gap-3 pb-28">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          Timeline
        </h2>
        {observationsQuery.isLoading && observations.length === 0 ? (
          <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-subtle-fill" />
        ) : observations.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm text-secondary">
              No logs yet. Tap Log to add your first.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {observations.map((observation) => (
              <ObservationRow
                key={observation.id}
                observation={observation}
                startedAt={batch.startedAt}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Fixed Log button in the thumb zone, above the bottom nav */}
      {!finished ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
          <div className="mx-auto max-w-lg">
            <Button
              asChild
              size="lg"
              className="pointer-events-auto w-full shadow-lg"
            >
              <Link href={`/batch/${batchId}/log`}>＋ Log observation</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
