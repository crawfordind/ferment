"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { RecipeEditor } from "@/components/batch/recipe-editor";
import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import { Button } from "@/components/ui/button";
import { useBatch, useUpdateBatch } from "@/hooks/use-batch";
import { type BatchInput, parseInputs, serializeInputs } from "@/lib/inputs";
import { unitOptions } from "@/lib/units";
import { cn } from "@/lib/utils";

export default function EditBatchPage() {
  const params = useParams<{ id: string }>();
  const batchId = params.id;
  const router = useRouter();
  const batchQuery = useBatch(batchId);
  const updateBatch = useUpdateBatch(batchId);
  const { system } = useMeasurementSystem();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [sizeUnit, setSizeUnit] = useState("kg");
  const [inputs, setInputs] = useState<BatchInput[]>([]);
  const [yieldValue, setYieldValue] = useState("");
  const [yieldUnit, setYieldUnit] = useState("L");
  const [costAmount, setCostAmount] = useState("");
  const [lotId, setLotId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Seed the form once from the loaded batch.
  useEffect(() => {
    if (hydrated || !batchQuery.data) return;
    const batch = batchQuery.data;
    setName(batch.name);
    setCode(batch.code);
    setSizeValue(batch.sizeValue != null ? String(batch.sizeValue) : "");
    setSizeUnit(batch.sizeUnit ?? "kg");
    setInputs(parseInputs(batch.inputs));
    setYieldValue(batch.yieldValue != null ? String(batch.yieldValue) : "");
    setYieldUnit(batch.yieldUnit ?? "L");
    setCostAmount(batch.costAmount != null ? String(batch.costAmount) : "");
    setLotId(batch.lotId ?? "");
    setHydrated(true);
  }, [batchQuery.data, hydrated]);

  if (batchQuery.isLoading || !batchQuery.data) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div className="h-10 animate-pulse rounded-[var(--radius-card)] bg-subtle-fill" />
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-subtle-fill" />
      </main>
    );
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) return;

    const toNumber = (value: string): number | null => {
      const parsed = value.trim() ? Number(value) : null;
      return parsed !== null && Number.isFinite(parsed) ? parsed : null;
    };

    await updateBatch.mutateAsync({
      name: trimmedName,
      code: trimmedCode,
      sizeValue: toNumber(sizeValue),
      sizeUnit,
      inputs: serializeInputs(inputs),
      yieldValue: toNumber(yieldValue),
      yieldUnit,
      costAmount: toNumber(costAmount),
      lotId: lotId.trim() || null,
    });
    router.replace(`/batch/${batchId}`);
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Edit batch</h1>
      </header>

      <section className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="batch-name" className="text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="batch-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="batch-code" className="text-sm font-medium text-ink">
            Short code
          </label>
          <input
            id="batch-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-subtle-fill px-3 py-2 font-semibold uppercase tracking-wide text-ink focus:border-accent focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Batch size</span>
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              placeholder="Optional"
              value={sizeValue}
              onChange={(event) => setSizeValue(event.target.value)}
              aria-label="Batch size amount"
              className="min-h-tap-min w-28 rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
            />
            <div className="flex flex-1 gap-1.5">
              {unitOptions(system, sizeUnit).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setSizeUnit(unit)}
                  aria-pressed={sizeUnit === unit}
                  className={cn(
                    "min-h-tap-min flex-1 rounded-[var(--radius-chip)] border-2 text-sm font-semibold transition-colors",
                    sizeUnit === unit
                      ? "border-accent bg-subtle-fill text-ink"
                      : "border-border bg-white text-secondary hover:bg-subtle-fill",
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Recipe</span>
          <RecipeEditor inputs={inputs} onChange={setInputs} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Yield</span>
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              placeholder="Optional"
              value={yieldValue}
              onChange={(event) => setYieldValue(event.target.value)}
              aria-label="Yield amount"
              className="min-h-tap-min w-28 rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
            />
            <div className="flex flex-1 gap-1.5">
              {unitOptions(system, yieldUnit).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setYieldUnit(unit)}
                  aria-pressed={yieldUnit === unit}
                  className={cn(
                    "min-h-tap-min flex-1 rounded-[var(--radius-chip)] border-2 text-sm font-semibold transition-colors",
                    yieldUnit === unit
                      ? "border-accent bg-subtle-fill text-ink"
                      : "border-border bg-white text-secondary hover:bg-subtle-fill",
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="batch-cost" className="text-sm font-medium text-ink">
            Input cost
          </label>
          <input
            id="batch-cost"
            inputMode="decimal"
            placeholder="Optional"
            value={costAmount}
            onChange={(event) => setCostAmount(event.target.value)}
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
          <p className="text-xs text-muted">
            Total ingredient cost. Shown as cost per unit of yield.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="batch-lot" className="text-sm font-medium text-ink">
            Lot ID
          </label>
          <input
            id="batch-lot"
            value={lotId}
            onChange={(event) => setLotId(event.target.value)}
            placeholder="Auto-assigned on finish"
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 font-medium uppercase tracking-wide text-ink focus:border-accent focus:outline-none"
          />
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        {updateBatch.error ? (
          <p className="text-sm text-status-needs-action-text" role="alert">
            Could not save changes. Try again.
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={!name.trim() || !code.trim() || updateBatch.isPending}
            onClick={handleSave}
          >
            {updateBatch.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </main>
  );
}
