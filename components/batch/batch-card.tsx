import Link from "next/link";

import { batchInitials } from "@/lib/ferment-visuals";
import { computeBatchProgress, formatProgressLabel } from "@/lib/progress";
import { getSeedTemplate } from "@/lib/seed-data";
import type { LocalBatch } from "@/offline/dexie";
import { cn } from "@/lib/utils";

import { StatusIndicator } from "./status-indicator";
import { ProgressBar } from "./progress-bar";
import { PhotoThumb } from "./photo-thumb";

export function BatchCard({
  batch,
  hint = null,
  emphasis = "default",
}: {
  batch: LocalBatch;
  hint?: string | null;
  /**
   * "focus" gives the card the heavy ink border to mark it as the single
   * next-action item; lists use "default" (hairline) to stay calm.
   */
  emphasis?: "default" | "focus";
}) {
  const finished = batch.status !== "active";
  const progress = computeBatchProgress(batch, getSeedTemplate(batch.type));

  return (
    <Link
      href={`/batch/${batch.id}`}
      className={cn(
        "flex items-stretch overflow-hidden rounded-[var(--radius-card)] border-2 bg-card shadow-[var(--shadow-sm)]",
        emphasis === "focus" ? "border-ink-border" : "border-hairline",
        "hover:shadow-[var(--shadow-md)] hover:bg-subtle-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        finished && "opacity-70",
      )}
    >
      {/* Category color stripe */}
      <span aria-hidden className="w-1.5 shrink-0 bg-accent" />

      <PhotoThumb
        photoId={batch.thumbnailPhotoId}
        className="m-2 size-[52px] shrink-0 rounded-lg"
        grayscale={finished}
        label={batchInitials(batch.name, batch.code)}
        type={batch.type}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-ink">
              {batch.name}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {batch.code}
            </p>
          </div>
          <StatusIndicator health={batch.health} className="shrink-0 pt-0.5" />
        </div>

        {hint ? (
          <span className="inline-flex w-fit max-w-full items-center truncate rounded-[var(--radius-chip)] bg-subtle-fill px-2 py-0.5 text-xs font-medium text-secondary">
            {hint}
          </span>
        ) : null}

        {/* Progress + ready date — the batch's sense of "where am I, when's it
            done". The bar only appears when the ferment has a known length;
            template-less custom batches just show their day count. */}
        {!finished ? (
          <div className="mt-0.5 flex flex-col gap-1">
            {progress.percent != null ? (
              <ProgressBar percent={progress.percent} phase={progress.phase} />
            ) : null}
            <p className="text-[11px] font-medium text-secondary">
              {formatProgressLabel(progress)}
            </p>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
