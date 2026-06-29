"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Camera, Plus } from "lucide-react";

import { PhotoThumb } from "@/components/batch/photo-thumb";
import { SensoryChip } from "@/components/chips/sensory-chip";
import { VoiceRecorder, type VoiceResult } from "@/components/voice/voice-recorder";
import { Button } from "@/components/ui/button";
import { presignPhotoApi } from "@/lib/api/client";
import { useBatch } from "@/hooks/use-batch";
import { useCreateObservation } from "@/hooks/use-observations";
import { useCapturePhoto } from "@/hooks/use-photos";
import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import { toCelsius, unitSuffix } from "@/lib/temperature";
import { newId } from "@/lib/id";
import { saveAudioBlobLocal } from "@/offline/repository";
import {
  getChipsByGroup,
  getChipsForType,
  type ChipDefinition,
  type ChipGroup,
} from "@/lib/chips";

const GROUP_LABELS: Record<ChipGroup, string> = {
  smell: "Smell",
  activity: "Activity",
  surface: "Surface",
};

const GROUP_ORDER: ChipGroup[] = ["smell", "activity", "surface"];

function ChipGroupBlock({
  group,
  chips,
  selected,
  onToggle,
}: {
  group: ChipGroup;
  chips: ChipDefinition[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
        {GROUP_LABELS[group]}
      </h3>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <SensoryChip
            key={chip.key}
            label={chip.label}
            severity={chip.severity}
            selected={selected.has(chip.key)}
            onToggle={() => onToggle(chip.key)}
          />
        ))}
      </div>
    </div>
  );
}

export default function QuickLogPage() {
  const params = useParams<{ id: string }>();
  const batchId = params.id;
  const router = useRouter();

  const batchQuery = useBatch(batchId);
  const createObservation = useCreateObservation(batchId);
  const capturePhoto = useCapturePhoto(batchId);
  const { temperatureUnit } = useMeasurementSystem();

  // Pre-generate the observation id so photos captured before Save link to it.
  const observationId = useMemo(() => newId(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");
  const [ph, setPh] = useState("");
  const [brix, setBrix] = useState("");
  // Held in the user's preferred unit; converted to Celsius on save.
  const [temp, setTemp] = useState("");
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [voice, setVoice] = useState<VoiceResult>({
    audioBlob: null,
    format: "webm",
    transcript: "",
    status: "none",
  });

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const photo = await capturePhoto.mutateAsync({ file, observationId });
      setPhotoIds((prev) => [...prev, photo.id]);
    }
  }

  const { primary, more } = useMemo(() => {
    if (!batchQuery.data) {
      return { primary: [] as ChipDefinition[], more: [] as ChipDefinition[] };
    }
    return getChipsForType(batchQuery.data.type);
  }, [batchQuery.data]);

  const primaryByGroup = getChipsByGroup(primary);
  const moreByGroup = getChipsByGroup(more);

  function toggleChip(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave() {
    let voiceAudioKey: string | null = null;
    let voiceTranscript: string | null = null;
    let transcriptStatus: VoiceResult["status"] = "none";

    if (voice.audioBlob) {
      await saveAudioBlobLocal(observationId, voice.audioBlob);
      voiceAudioKey = `audio/${observationId}.${voice.format}`;
      voiceTranscript = voice.transcript.trim() || null;
      transcriptStatus = voice.status === "none" ? "pending" : voice.status;

      // Best-effort R2 upload; if it fails the reconnect flush retries it.
      if (typeof navigator === "undefined" || navigator.onLine) {
        try {
          const { uploadUrl } = await presignPhotoApi({
            photoId: observationId,
            ext: voice.format,
            prefix: "audio",
          });
          await fetch(uploadUrl, { method: "PUT", body: voice.audioBlob });
        } catch {
          // Leave for the reconnect flush.
        }
      }
    }

    const parseReading = (value: string): number | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    };

    await createObservation.mutateAsync({
      id: observationId,
      note: note.trim() || null,
      chipKeys: Array.from(selected),
      voiceTranscript,
      voiceAudioKey,
      transcriptStatus,
      ph: parseReading(ph),
      brix: parseReading(brix),
      tempC: toCelsius(parseReading(temp), temperatureUnit),
    });
    router.replace(`/batch/${batchId}`);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-40">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Quick log</h1>
        <Button asChild variant="ghost" size="default">
          <Link href={`/batch/${batchId}`} aria-label="Cancel">
            ✕
          </Link>
        </Button>
      </header>

      {/* Photo block */}
      <section className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        {photoIds.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={capturePhoto.isPending}
            className="flex min-h-[var(--tap-primary)] items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-border bg-subtle-fill px-4 py-6 text-secondary"
          >
            <Camera className="size-6" aria-hidden />
            <span className="text-sm font-medium">
              {capturePhoto.isPending ? "Adding photo…" : "Add photo"}
            </span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {photoIds.map((id) => (
              <PhotoThumb
                key={id}
                photoId={id}
                className="size-20 rounded-lg border border-hairline"
              />
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={capturePhoto.isPending}
              aria-label="Add another photo"
              className="flex size-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-subtle-fill text-secondary"
            >
              <Plus className="size-6" aria-hidden />
            </button>
          </div>
        )}
      </section>

      {/* Sensory chips */}
      <section className="flex flex-col gap-4">
        {GROUP_ORDER.map((group) => (
          <ChipGroupBlock
            key={group}
            group={group}
            chips={primaryByGroup[group]}
            selected={selected}
            onToggle={toggleChip}
          />
        ))}

        {more.length > 0 ? (
          <div className="flex flex-col gap-4">
            {showMore ? (
              GROUP_ORDER.map((group) => (
                <ChipGroupBlock
                  key={`more-${group}`}
                  group={group}
                  chips={moreByGroup[group]}
                  selected={selected}
                  onToggle={toggleChip}
                />
              ))
            ) : null}
            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              className="self-start text-sm font-semibold text-accent"
            >
              {showMore ? "Show fewer" : "More options"}
            </button>
          </div>
        ) : null}
      </section>

      {/* Measurements */}
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          Measurements
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { label: "pH", value: ph, setValue: setPh, hint: "0–14" },
              { label: "Brix", value: brix, setValue: setBrix, hint: "°Bx" },
              {
                label: "Temp",
                value: temp,
                setValue: setTemp,
                hint: unitSuffix(temperatureUnit),
              },
            ] as const
          ).map((field) => (
            <label key={field.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-secondary">
                {field.label}
                <span className="ml-1 font-normal text-muted">{field.hint}</span>
              </span>
              <input
                inputMode="decimal"
                value={field.value}
                onChange={(event) => field.setValue(event.target.value)}
                placeholder="—"
                aria-label={`${field.label} reading`}
                className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Voice note */}
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          Voice note
        </h3>
        <VoiceRecorder onChange={setVoice} />
      </section>

      {/* Free note */}
      <section className="flex flex-col gap-2">
        <label
          htmlFor="note"
          className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted"
        >
          Note
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Optional"
          className="rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
        />
      </section>

      {/* Fixed Save in the thumb zone */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
        <div className="mx-auto max-w-lg">
          <Button
            type="button"
            size="lg"
            className="pointer-events-auto w-full shadow-lg"
            disabled={createObservation.isPending}
            onClick={handleSave}
          >
            {createObservation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </main>
  );
}
