"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  DilutionCalculator,
  type DilutionState,
} from "@/components/batch/dilution-calculator";
import { Button } from "@/components/ui/button";
import { useBatch } from "@/hooks/use-batch";
import { useCreateObservation } from "@/hooks/use-observations";
import { serializeApplication, type Application } from "@/lib/applications";
import { getDocByFermentType } from "@/lib/knowledge";

export default function RecordApplicationPage() {
  const params = useParams<{ id: string }>();
  const batchId = params.id;
  const router = useRouter();

  const batchQuery = useBatch(batchId);
  const createObservation = useCreateObservation(batchId);

  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [mix, setMix] = useState<DilutionState | null>(null);

  // Stable identity so the calculator's report effect doesn't refire in a loop.
  const handleMixChange = useCallback((state: DilutionState) => {
    setMix(state);
  }, []);

  const dilution = getDocByFermentType(batchQuery.data?.type)?.dilution ?? null;
  const canSave = target.trim().length > 0 && !createObservation.isPending;

  async function handleSave() {
    if (target.trim().length === 0) return;

    const application: Application = {
      target: target.trim(),
      dilution: dilution,
      waterValue: mix?.waterValue ?? null,
      waterUnit: mix?.waterUnit ?? null,
      doseMinMl: mix?.doseMinMl ?? null,
      doseMaxMl: mix?.doseMaxMl ?? null,
    };

    await createObservation.mutateAsync({
      note: note.trim() || null,
      application: serializeApplication(application),
    });
    router.replace(`/batch/${batchId}`);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-40">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Record application</h1>
        <Button asChild variant="ghost" size="default">
          <Link href={`/batch/${batchId}`} aria-label="Cancel">
            ✕
          </Link>
        </Button>
      </header>

      {/* What it went on */}
      <section className="flex flex-col gap-2">
        <label
          htmlFor="target"
          className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted"
        >
          Applied to
        </label>
        <input
          id="target"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="e.g. Tomato bed, seedling trays"
          className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
        />
      </section>

      {/* Dilution helper */}
      {dilution ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Dilution
          </h2>
          <DilutionCalculator dilution={dilution} onChange={handleMixChange} />
        </section>
      ) : null}

      {/* Note */}
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
          placeholder="Optional — method, weather, crop stage"
          className="rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
        />
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
        <div className="mx-auto max-w-lg">
          <Button
            type="button"
            size="lg"
            className="pointer-events-auto w-full shadow-lg"
            disabled={!canSave}
            onClick={handleSave}
          >
            {createObservation.isPending ? "Saving…" : "Save application"}
          </Button>
        </div>
      </div>
    </main>
  );
}
