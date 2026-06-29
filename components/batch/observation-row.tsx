"use client";

import { CloudOff } from "lucide-react";

import { ChipTag } from "@/components/chips/chip-tag";
import { useIsPending } from "@/components/providers/sync-provider";
import { useTemperatureUnit } from "@/components/providers/temperature-unit-provider";
import { formatTemperature } from "@/lib/temperature";
import { useObservationPhotos } from "@/hooks/use-photos";
import { computeDayInProcess } from "@/lib/day";
import type { LocalObservation } from "@/offline/dexie";

import { PhotoThumb } from "./photo-thumb";
import { PhotoPlaceholder } from "./photo-placeholder";

function formatObservedAt(observedAt: number): string {
  return new Date(observedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ObservationRow({
  observation,
  startedAt,
}: {
  observation: LocalObservation;
  startedAt: number;
}) {
  const day = computeDayInProcess(startedAt, observation.observedAt);
  const photos = useObservationPhotos(observation.id).data ?? [];
  const pending = useIsPending(observation.id);
  const { unit } = useTemperatureUnit();

  return (
    <li className="flex gap-3 rounded-[var(--radius-card)] border border-hairline bg-white p-3">
      <div className="relative size-14 shrink-0">
        {photos.length > 0 ? (
          <PhotoThumb
            photoId={photos[0].id}
            className="size-14 rounded-lg"
          />
        ) : (
          <PhotoPlaceholder className="size-14 rounded-lg" />
        )}
        {photos.length > 1 ? (
          <span className="absolute bottom-0 right-0 rounded-tl-md rounded-br-lg bg-ink/70 px-1 text-[10px] font-semibold text-white">
            +{photos.length - 1}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-ink">Day {day}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            {pending ? (
              <span className="inline-flex items-center gap-1 text-secondary">
                <CloudOff className="size-3" aria-hidden />
                Will sync
              </span>
            ) : null}
            {formatObservedAt(observation.observedAt)}
          </span>
        </div>

        {observation.chipKeys.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {observation.chipKeys.map((key) => (
              <ChipTag key={key} chipKey={key} />
            ))}
          </div>
        ) : null}

        {observation.ph != null ||
        observation.brix != null ||
        observation.tempC != null ? (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-medium text-secondary">
            {observation.ph != null ? <span>pH {observation.ph}</span> : null}
            {observation.brix != null ? (
              <span>{observation.brix}°Bx</span>
            ) : null}
            {observation.tempC != null ? (
              <span>{formatTemperature(observation.tempC, unit)}</span>
            ) : null}
          </div>
        ) : null}

        {observation.voiceTranscript ? (
          <p className="text-sm italic text-secondary">
            “{observation.voiceTranscript}”
          </p>
        ) : null}

        {observation.note ? (
          <p className="text-sm text-ink">{observation.note}</p>
        ) : null}

        {observation.transcriptStatus === "pending" ? (
          <p className="text-xs text-muted">
            Voice note saved · transcribing on reconnect
          </p>
        ) : null}
      </div>
    </li>
  );
}
