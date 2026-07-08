"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { computeDayInProcess } from "@/lib/day";
import type { LocalPhoto } from "@/offline/dexie";

import { PhotoThumb } from "./photo-thumb";

/**
 * A horizontal filmstrip of every photo on a batch, oldest → newest, sitting
 * across the top of the timeline. It turns a batch's photos into a visual
 * history at a glance and — via the trailing add tile — gives even a fresh,
 * log-less batch something to build toward instead of an empty column.
 */
export function TimelinePhotoStrip({
  photos,
  startedAt,
  logHref,
  canAdd,
}: {
  photos: LocalPhoto[];
  startedAt: number;
  /** Where the add tile points (the log screen). */
  logHref: string;
  /** Active batches can still add photos; finished ones show history only. */
  canAdd: boolean;
}) {
  const ordered = [...photos].sort((a, b) => a.takenAt - b.takenAt);

  // Nothing to show and nothing to add — let the timeline's own empty state speak.
  if (ordered.length === 0 && !canAdd) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ordered.map((photo) => (
          <figure
            key={photo.id}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <PhotoThumb photoId={photo.id} className="size-16 rounded-lg" />
            <figcaption className="text-[10px] font-medium text-muted">
              Day {computeDayInProcess(startedAt, photo.takenAt)}
            </figcaption>
          </figure>
        ))}

        {canAdd ? (
          <Link
            href={logHref}
            aria-label="Add a photo"
            className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-border text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus className="size-5" aria-hidden />
            <span className="text-[10px] font-semibold">Add</span>
          </Link>
        ) : null}
      </div>

      {ordered.length === 0 ? (
        <p className="px-0.5 text-xs text-secondary">
          Add a photo each check-in to build a visual history.
        </p>
      ) : null}
    </div>
  );
}
