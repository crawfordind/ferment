"use client";

import { Plus, X } from "lucide-react";

import { type BatchInput, computeRatio, computeSaltPercent } from "@/lib/inputs";

const UNITS = ["kg", "g", "L", "ml"];

/** Repeatable ingredient rows with a live ratio / salt-% preview. */
export function RecipeEditor({
  inputs,
  onChange,
}: {
  inputs: BatchInput[];
  onChange: (next: BatchInput[]) => void;
}) {
  function update(index: number, patch: Partial<BatchInput>) {
    onChange(inputs.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function add() {
    onChange([...inputs, { name: "", quantity: null, unit: "kg" }]);
  }

  function remove(index: number) {
    onChange(inputs.filter((_, i) => i !== index));
  }

  const ratio = computeRatio(inputs);
  const saltPercent = computeSaltPercent(inputs);

  return (
    <div className="flex flex-col gap-2">
      {inputs.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={row.name}
            onChange={(event) => update(index, { name: event.target.value })}
            placeholder="Ingredient"
            aria-label={`Ingredient ${index + 1} name`}
            className="min-h-tap-min min-w-0 flex-1 rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
          <input
            inputMode="decimal"
            value={row.quantity ?? ""}
            onChange={(event) => {
              const value = event.target.value.trim();
              const parsed = value ? Number(value) : null;
              update(index, {
                quantity:
                  parsed !== null && Number.isFinite(parsed) ? parsed : null,
              });
            }}
            placeholder="Qty"
            aria-label={`Ingredient ${index + 1} quantity`}
            className="min-h-tap-min w-16 rounded-[var(--radius-card)] border-2 border-border bg-white px-2 py-2 text-ink focus:border-accent focus:outline-none"
          />
          <select
            value={row.unit}
            onChange={(event) => update(index, { unit: event.target.value })}
            aria-label={`Ingredient ${index + 1} unit`}
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-2 py-2 text-ink focus:border-accent focus:outline-none"
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove ingredient ${index + 1}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-chip)] text-muted hover:bg-subtle-fill hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex min-h-tap-min items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-border bg-subtle-fill text-sm font-medium text-secondary hover:bg-white"
      >
        <Plus className="size-4" aria-hidden />
        Add ingredient
      </button>

      {ratio || saltPercent !== null ? (
        <p className="text-xs text-muted">
          {ratio ? `Ratio ${ratio}` : null}
          {ratio && saltPercent !== null ? " · " : null}
          {saltPercent !== null ? `Salt ${saltPercent.toFixed(1)}%` : null}
        </p>
      ) : null}
    </div>
  );
}
