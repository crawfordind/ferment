"use client";

import { computeDayInProcess } from "@/lib/day";
import type { LocalPhoto } from "@/offline/dexie";

import { PhotoThumb } from "./photo-thumb";
import { PhotoPlaceholder } from "./photo-placeholder";

/**
 * Timeline entry for photos captured when the batch was created (the cover and
 * any other first photos — those with no observation). Without this they would
 * only ever show in the header, never in the timeline alongside the logs.
 */
export function CreationRow({
  photos,
  startedAt,
}: {
  photos: LocalPhoto[];
  startedAt: number;
}) {
  const day = computeDayInProcess(startedAt, photos[0]?.takenAt ?? startedAt);

  return (
    <li className="flex gap-3 rounded-[var(--radius-card)] border border-hairline bg-white p-3">
      <div className="size-14 shrink-0">
        {photos.length > 0 ? (
          <PhotoThumb photoId={photos[0].id} className="size-14 rounded-lg" />
        ) : (
          <PhotoPlaceholder className="size-14 rounded-lg" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-ink">Day {day}</span>
          <span className="text-xs text-muted">Batch created</span>
        </div>

        {photos.length > 1 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {photos.slice(1).map((photo) => (
              <PhotoThumb
                key={photo.id}
                photoId={photo.id}
                className="size-12 rounded-md"
              />
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
