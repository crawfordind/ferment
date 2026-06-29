"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

import { RecipeEditor } from "@/components/batch/recipe-editor";
import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import { Button } from "@/components/ui/button";
import { useBatches, useCreateBatch } from "@/hooks/use-batches";
import { capturePhotoForBatch } from "@/hooks/use-photos";
import { generateNextBatchCode, suggestBatchName } from "@/lib/codes";
import type { BatchInput } from "@/lib/inputs";
import { SEED_TEMPLATES } from "@/lib/seed-data";
import type { FermentType } from "@/lib/schema";
import { defaultUnitFor, preferredUnit, quantityUnitsFor } from "@/lib/units";
import { cn } from "@/lib/utils";

type Category = { key: string; label: string; available: boolean };

const CATEGORIES: Category[] = [
  { key: "fertilizer", label: "Fertilizers", available: true },
  { key: "food", label: "Food", available: true },
  { key: "beverage", label: "Beverage", available: false },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            n <= step ? "bg-accent" : "bg-hairline",
          )}
        />
      ))}
    </div>
  );
}

function OptionRow({
  selected,
  disabled,
  onClick,
  title,
  subtitle,
  badge,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-tap-primary w-full items-center gap-3 rounded-[var(--radius-card)] border-2 px-4 py-3 text-left transition-colors",
        selected
          ? "border-accent bg-subtle-fill"
          : "border-border bg-white hover:bg-subtle-fill",
        disabled && "cursor-not-allowed opacity-60 hover:bg-white",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-accent" : "border-border",
        )}
      >
        {selected ? <span className="size-2.5 rounded-full bg-accent" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold text-ink">{title}</span>
        {subtitle ? (
          <span className="truncate text-sm text-secondary">{subtitle}</span>
        ) : null}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-[var(--radius-chip)] bg-subtle-fill px-2 py-0.5 text-xs font-medium text-muted">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function NewBatchPage() {
  const router = useRouter();
  const batchesQuery = useBatches();
  const createBatch = useCreateBatch();
  const { system } = useMeasurementSystem();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("fertilizer");
  const [type, setType] = useState<FermentType | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [sizeUnit, setSizeUnit] = useState(() =>
    defaultUnitFor("mass", "metric"),
  );
  const [inputs, setInputs] = useState<BatchInput[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview the chosen cover photo before the batch exists.
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const existingCodes = useMemo(
    () =>
      (batchesQuery.data ?? [])
        .filter((batch) => type && batch.type === type)
        .map((batch) => batch.code),
    [batchesQuery.data, type],
  );

  const templatesForCategory = useMemo(
    () => SEED_TEMPLATES.filter((template) => template.category === category),
    [category],
  );

  // Auto-fill name, code, and default unit when a type is chosen.
  useEffect(() => {
    if (!type) return;
    const template = SEED_TEMPLATES.find((t) => t.type === type);
    setName(suggestBatchName(type));
    setCode(generateNextBatchCode(type, existingCodes));
    setSizeUnit(preferredUnit(template?.defaultUnit ?? "kg", system));
    // existingCodes/system intentionally omitted: only re-seed on type change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Keep the size unit in the active system (e.g. kg → lb) as the preference
  // resolves on mount or the user switches systems.
  useEffect(() => {
    setSizeUnit((unit) => preferredUnit(unit, system));
  }, [system]);

  async function handleStart() {
    if (!type || starting) return;
    setStarting(true);
    try {
      const parsedSize = sizeValue.trim() ? Number(sizeValue) : null;
      const batch = await createBatch.mutateAsync({
        type,
        name,
        code,
        category,
        sizeValue:
          parsedSize !== null && Number.isFinite(parsedSize)
            ? parsedSize
            : null,
        sizeUnit,
        inputs,
      });

      // Attach the optional first photo now that the batch id exists.
      if (coverFile) {
        try {
          await capturePhotoForBatch(batch.id, coverFile);
        } catch {
          // Non-blocking: the batch is created; the photo can be added later.
        }
      }

      router.replace(`/batch/${batch.id}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">New batch</h1>
          <span className="text-sm text-muted">Step {step} of 3</span>
        </div>
        <ProgressBar step={step} />
      </header>

      {step === 1 ? (
        <section className="flex flex-1 flex-col gap-3">
          <p className="text-sm text-secondary">What are you making?</p>
          {CATEGORIES.map((option) => (
            <OptionRow
              key={option.key}
              title={option.label}
              selected={option.available && category === option.key}
              disabled={!option.available}
              badge={option.available ? undefined : "Coming soon"}
              onClick={
                option.available
                  ? () => {
                      setCategory(option.key);
                      setType(null);
                    }
                  : undefined
              }
            />
          ))}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex flex-1 flex-col gap-3">
          <p className="text-sm text-secondary">Pick a ferment type.</p>
          {templatesForCategory.map((template) => (
            <OptionRow
              key={template.type}
              title={template.name}
              subtitle={
                template.type === "custom" || template.type === "food"
                  ? "Blank template"
                  : undefined
              }
              selected={type === template.type}
              onClick={() => setType(template.type)}
            />
          ))}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="batch-name"
              className="text-sm font-medium text-ink"
            >
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
            <label
              htmlFor="batch-code"
              className="text-sm font-medium text-ink"
            >
              Short code
            </label>
            <input
              id="batch-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-subtle-fill px-3 py-2 font-semibold uppercase tracking-wide text-ink focus:border-accent focus:bg-white focus:outline-none"
            />
            <p className="text-xs text-muted">Auto-filled. Edit if you like.</p>
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
                {quantityUnitsFor(system).map((unit) => (
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
            <p className="text-xs text-muted">
              Ingredients and amounts, so the batch is repeatable. Optional.
            </p>
            <RecipeEditor inputs={inputs} onChange={setInputs} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">First photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                setCoverFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={
                  coverPreview ? "Change first photo" : "Add first photo"
                }
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-subtle-fill text-secondary"
              >
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview}
                    alt="First photo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Camera className="size-6" aria-hidden />
                )}
              </button>
              <p className="text-sm text-muted">
                {coverFile
                  ? "Looks good — tap to retake. Skippable."
                  : "Snap one now or add it later. Skippable."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Thumb-zone navigation */}
      <div className="mt-auto flex flex-col gap-2 pt-4">
        {createBatch.error ? (
          <p className="text-sm text-status-needs-action-text" role="alert">
            Could not start the batch. Try again.
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => {
              if (step === 1) {
                router.back();
              } else {
                setStep((s) => s - 1);
              }
            }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={step === 2 && !type}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={!type || starting}
              onClick={handleStart}
            >
              {starting ? "Starting…" : "Start batch"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
