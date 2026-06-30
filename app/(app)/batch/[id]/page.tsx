"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { CreationRow } from "@/components/batch/creation-row";
import { ObservationRow } from "@/components/batch/observation-row";
import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import { formatTemperature } from "@/lib/temperature";
import { PhotoThumb } from "@/components/batch/photo-thumb";
import { StageBanner } from "@/components/batch/stage-banner";
import { StatusIndicator } from "@/components/batch/status-indicator";
import { DayChip } from "@/components/batch/day-chip";
import { Button } from "@/components/ui/button";
import { useBatch, useUpdateBatch } from "@/hooks/use-batch";
import { useObservations } from "@/hooks/use-observations";
import { useBatchPhotos } from "@/hooks/use-photos";
import type { LocalPhoto } from "@/offline/dexie";
import { computeDayInProcess } from "@/lib/day";
import { costPerUnit, formatCostPerUnit } from "@/lib/economics";
import { computeRatio, computeSaltPercent, parseInputs } from "@/lib/inputs";
import { generateLotId } from "@/lib/lots";
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
                  onClick={() => {
                    const finishedAt = Date.now();
                    const batch = batchQuery.data;
                    // Stamp a traceability lot id on finish if none set yet.
                    const lotId =
                      batch && !batch.lotId
                        ? generateLotId(batch.code, finishedAt)
                        : undefined;
                    apply({
                      status: "finished",
                      finishedAt,
                      ...(lotId ? { lotId } : {}),
                    });
                  }}
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
  const photosQuery = useBatchPhotos(batchId);
  const { temperatureUnit } = useMeasurementSystem();

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

  // Group every synced photo by its observation; photos with no observation are
  // the creation/cover shots and get their own timeline entry.
  const photos = photosQuery.data ?? [];
  const photosByObservation = new Map<string, LocalPhoto[]>();
  const creationPhotos: LocalPhoto[] = [];
  for (const photo of photos) {
    if (photo.observationId) {
      const list = photosByObservation.get(photo.observationId) ?? [];
      list.push(photo);
      photosByObservation.set(photo.observationId, list);
    } else {
      creationPhotos.push(photo);
    }
  }

  const recipe = parseInputs(batch.inputs);
  const ratio = computeRatio(recipe);
  const saltPercent = computeSaltPercent(recipe);
  const latestReading =
    observations.find(
      (observation) =>
        observation.ph != null ||
        observation.brix != null ||
        observation.tempC != null,
    ) ?? null;
  const cost = costPerUnit(batch.costAmount, batch.yieldValue, batch.yieldUnit);

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

      {/* Recipe */}
      {recipe.length > 0 ? (
        <section className="rounded-[var(--radius-card)] border border-hairline bg-white p-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Recipe
          </h2>
          <ul className="flex flex-col gap-1">
            {recipe.map((item, index) => (
              <li
                key={index}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="text-ink">{item.name}</span>
                <span className="shrink-0 text-secondary">
                  {item.quantity != null
                    ? `${item.quantity} ${item.unit}`.trim()
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
          {ratio || saltPercent !== null ? (
            <p className="mt-2 border-t border-hairline pt-2 text-xs text-muted">
              {ratio ? `Ratio ${ratio}` : null}
              {ratio && saltPercent !== null ? " · " : null}
              {saltPercent !== null ? `Salt ${saltPercent.toFixed(1)}%` : null}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Latest measurements */}
      {latestReading ? (
        <section className="rounded-[var(--radius-card)] border border-hairline bg-white p-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Latest measurements · Day{" "}
            {computeDayInProcess(batch.startedAt, latestReading.observedAt)}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {latestReading.ph != null ? (
              <span className="text-ink">
                pH <span className="font-semibold">{latestReading.ph}</span>
              </span>
            ) : null}
            {latestReading.brix != null ? (
              <span className="text-ink">
                Brix{" "}
                <span className="font-semibold">{latestReading.brix}°Bx</span>
              </span>
            ) : null}
            {latestReading.tempC != null ? (
              <span className="text-ink">
                Temp{" "}
                <span className="font-semibold">
                  {formatTemperature(latestReading.tempC, temperatureUnit)}
                </span>
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Yield, cost & lot (finished batches) */}
      {finished && (batch.yieldValue != null || cost || batch.lotId) ? (
        <section className="rounded-[var(--radius-card)] border border-hairline bg-white p-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Batch record
          </h2>
          <dl className="flex flex-col gap-1 text-sm">
            {batch.yieldValue != null ? (
              <div className="flex justify-between gap-3">
                <dt className="text-secondary">Yield</dt>
                <dd className="text-ink">
                  {batch.yieldValue} {batch.yieldUnit ?? ""}
                </dd>
              </div>
            ) : null}
            {cost ? (
              <div className="flex justify-between gap-3">
                <dt className="text-secondary">Cost per unit</dt>
                <dd className="text-ink">{formatCostPerUnit(cost)}</dd>
              </div>
            ) : null}
            {batch.lotId ? (
              <div className="flex justify-between gap-3">
                <dt className="text-secondary">Lot</dt>
                <dd className="font-medium uppercase tracking-wide text-ink">
                  {batch.lotId}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* Timeline */}
      <section className="flex flex-col gap-3 pb-28">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          Timeline
        </h2>
        {observationsQuery.isLoading && observations.length === 0 ? (
          <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-subtle-fill" />
        ) : observations.length === 0 && creationPhotos.length === 0 ? (
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
                photos={photosByObservation.get(observation.id) ?? []}
              />
            ))}
            {creationPhotos.length > 0 ? (
              <CreationRow photos={creationPhotos} startedAt={batch.startedAt} />
            ) : null}
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
