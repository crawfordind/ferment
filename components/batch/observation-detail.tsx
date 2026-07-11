"use client";

import { useEffect, useId, useRef } from "react";
import { CloudOff, Sprout, X } from "lucide-react";

import { ChipTag } from "@/components/chips/chip-tag";
import { useIsPending } from "@/components/providers/sync-provider";
import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import { parseApplication } from "@/lib/applications";
import { formatDose } from "@/lib/dilution";
import { computeDayInProcess } from "@/lib/day";
import { formatTemperature } from "@/lib/temperature";
import { formatQuantity } from "@/lib/units";
import type { LocalObservation, LocalPhoto } from "@/offline/dexie";

import { PhotoThumb } from "./photo-thumb";
import { PhotoPlaceholder } from "./photo-placeholder";

function formatObservedAt(observedAt: number): string {
  return new Date(observedAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type ObservationDetailTarget =
  | {
      kind: "observation";
      observation: LocalObservation;
      photos: LocalPhoto[];
    }
  | {
      kind: "creation";
      photos: LocalPhoto[];
      startedAt: number;
    };

/**
 * Full-screen detail card for a single log (or creation photos). Opens from
 * photo taps on the filmstrip / timeline so a thumb expands into the full
 * observation record without leaving the batch page.
 */
export function ObservationDetailSheet({
  target,
  startedAt,
  onClose,
}: {
  target: ObservationDetailTarget | null;
  startedAt: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!target) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="observation-sheet-backdrop absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label="Close detail"
        onClick={onClose}
      />

      <div className="observation-sheet-panel relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] border border-hairline bg-card shadow-[var(--shadow-lg)] sm:mx-4 sm:rounded-[var(--radius-card)]">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <h2 id={titleId} className="text-sm font-bold text-ink">
            {target.kind === "creation" ? "Batch created" : "Check-in detail"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-full text-secondary hover:bg-subtle-fill hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 py-4">
          {target.kind === "creation" ? (
            <CreationDetail
              photos={target.photos}
              startedAt={target.startedAt}
            />
          ) : (
            <ObservationDetailBody
              observation={target.observation}
              photos={target.photos}
              startedAt={startedAt}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CreationDetail({
  photos,
  startedAt,
}: {
  photos: LocalPhoto[];
  startedAt: number;
}) {
  const day = computeDayInProcess(startedAt, photos[0]?.takenAt ?? startedAt);
  const hero = photos[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-subtle-fill">
        {hero ? (
          <PhotoThumb
            photoId={hero.id}
            className="aspect-[4/3] w-full rounded-none"
            alt="Batch creation photo"
          />
        ) : (
          <PhotoPlaceholder className="aspect-[4/3] w-full rounded-none" />
        )}
      </div>
      <div>
        <p className="text-lg font-bold text-ink">Day {day}</p>
        <p className="text-sm text-secondary">Photos from when this batch started</p>
      </div>
      {photos.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {photos.slice(1).map((photo) => (
            <PhotoThumb
              key={photo.id}
              photoId={photo.id}
              className="size-20 rounded-lg"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ObservationDetailBody({
  observation,
  photos,
  startedAt,
}: {
  observation: LocalObservation;
  photos: LocalPhoto[];
  startedAt: number;
}) {
  const day = computeDayInProcess(startedAt, observation.observedAt);
  const pending = useIsPending(observation.id);
  const { system, temperatureUnit } = useMeasurementSystem();
  const application = parseApplication(observation.application);
  const hero = photos[0];

  const dose =
    application &&
    (application.doseMinMl != null || application.doseMaxMl != null)
      ? formatDose(
          {
            minMl: application.doseMinMl ?? application.doseMaxMl ?? 0,
            maxMl: application.doseMaxMl ?? application.doseMinMl ?? 0,
          },
          system,
        )
      : null;
  const water =
    application && application.waterValue != null && application.waterUnit
      ? formatQuantity(application.waterValue, application.waterUnit, system)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-subtle-fill">
        {hero ? (
          <PhotoThumb
            photoId={hero.id}
            className="aspect-[4/3] w-full rounded-none"
            alt={`Check-in Day ${day}`}
          />
        ) : application ? (
          <div className="flex aspect-[4/3] w-full items-center justify-center">
            <Sprout className="size-12 text-accent" aria-hidden />
          </div>
        ) : (
          <PhotoPlaceholder className="aspect-[4/3] w-full rounded-none" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-ink">Day {day}</p>
          <p className="text-sm text-secondary">
            {formatObservedAt(observation.observedAt)}
          </p>
        </div>
        {pending ? (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] bg-subtle-fill px-2 py-1 text-xs font-medium text-secondary">
            <CloudOff className="size-3" aria-hidden />
            Will sync
          </span>
        ) : null}
      </div>

      {application ? (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-subtle-fill px-3 py-2.5">
          <p className="text-sm font-semibold text-ink">
            Applied to {application.target}
          </p>
          <p className="mt-0.5 text-xs text-secondary">
            {[
              application.dilution,
              dose && water ? `${dose} in ${water}` : water,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ) : null}

      {observation.chipKeys.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Sensory notes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {observation.chipKeys.map((key) => (
              <ChipTag key={key} chipKey={key} />
            ))}
          </div>
        </div>
      ) : null}

      {observation.ph != null ||
      observation.brix != null ||
      observation.tempC != null ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Measurements
          </p>
          <dl className="grid grid-cols-3 gap-2">
            {observation.ph != null ? (
              <div className="rounded-[var(--radius-card)] border border-hairline bg-subtle-fill px-3 py-2 text-center">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  pH
                </dt>
                <dd className="mt-0.5 text-base font-bold text-ink">
                  {observation.ph}
                </dd>
              </div>
            ) : null}
            {observation.brix != null ? (
              <div className="rounded-[var(--radius-card)] border border-hairline bg-subtle-fill px-3 py-2 text-center">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Brix
                </dt>
                <dd className="mt-0.5 text-base font-bold text-ink">
                  {observation.brix}°
                </dd>
              </div>
            ) : null}
            {observation.tempC != null ? (
              <div className="rounded-[var(--radius-card)] border border-hairline bg-subtle-fill px-3 py-2 text-center">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Temp
                </dt>
                <dd className="mt-0.5 text-base font-bold text-ink">
                  {formatTemperature(observation.tempC, temperatureUnit)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      {observation.voiceTranscript ? (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Voice note
          </p>
          <p className="text-sm italic leading-relaxed text-secondary">
            “{observation.voiceTranscript}”
          </p>
        </div>
      ) : null}

      {observation.note ? (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Note
          </p>
          <p className="text-sm leading-relaxed text-ink">{observation.note}</p>
        </div>
      ) : null}

      {observation.transcriptStatus === "pending" ? (
        <p className="text-xs text-muted">
          Voice note saved · transcribing on reconnect
        </p>
      ) : null}

      {photos.length > 1 ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Photos
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.slice(1).map((photo) => (
              <PhotoThumb
                key={photo.id}
                photoId={photo.id}
                className="size-20 rounded-lg"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
