import Link from "next/link";

import { computeDayInProcess } from "@/lib/day";
import { batchInitials } from "@/lib/ferment-visuals";
import type { LocalBatch } from "@/offline/dexie";
import { cn } from "@/lib/utils";

import { DayChip } from "./day-chip";
import { StatusIndicator } from "./status-indicator";
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
  const day = computeDayInProcess(batch.startedAt);
  const finished = batch.status !== "active";

  return (
    <Link
      href={`/batch/${batch.id}`}
      className={cn(
        "flex items-stretch overflow-hidden rounded-[var(--radius-card)] border-2 bg-white",
        emphasis === "focus" ? "border-ink-border" : "border-hairline",
        "transition-colors hover:bg-subtle-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
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

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-2">
        <p className="truncate text-base font-bold leading-tight text-ink">
          {batch.name}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {batch.code}
        </p>
        {hint ? (
          <span className="mt-0.5 inline-flex w-fit max-w-full items-center truncate rounded-[var(--radius-chip)] bg-subtle-fill px-2 py-0.5 text-xs font-medium text-secondary">
            {hint}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 py-2 pr-3">
        <DayChip day={day} />
        <StatusIndicator health={batch.health} />
      </div>
    </Link>
  );
}
