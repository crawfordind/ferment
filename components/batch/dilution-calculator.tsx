"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets } from "lucide-react";

import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import {
  doseForWater,
  formatDose,
  parseDilutionRatio,
  volumeToMl,
  WATER_UNITS_IMPERIAL,
  WATER_UNITS_METRIC,
} from "@/lib/dilution";
import { cn } from "@/lib/utils";

export type DilutionState = {
  waterValue: number | null;
  waterUnit: string;
  doseMinMl: number | null;
  doseMaxMl: number | null;
};

/**
 * Turns a Knowledge Base dilution ratio (e.g. "1:800–1:1000") into an actual
 * dose for a chosen water volume — the bridge from "I made FPJ" to "I applied
 * FPJ". Pure client math, works offline. Optionally reports its state so the
 * Record-application form can capture what was mixed.
 */
export function DilutionCalculator({
  dilution,
  onChange,
  className,
}: {
  dilution: string;
  onChange?: (state: DilutionState) => void;
  className?: string;
}) {
  const { system } = useMeasurementSystem();
  const units =
    system === "imperial" ? WATER_UNITS_IMPERIAL : WATER_UNITS_METRIC;

  const [waterText, setWaterText] = useState("");
  const [waterUnit, setWaterUnit] = useState<string>(units[0]);

  // Keep the unit valid when the measurement system changes.
  useEffect(() => {
    if (!(units as readonly string[]).includes(waterUnit)) {
      setWaterUnit(units[0]);
    }
  }, [units, waterUnit]);

  const ratio = useMemo(() => parseDilutionRatio(dilution), [dilution]);

  const waterValue = useMemo(() => {
    const trimmed = waterText.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [waterText]);

  const dose = useMemo(() => {
    if (!ratio) return null;
    const waterMl = volumeToMl(waterValue, waterUnit);
    if (waterMl === null || waterMl <= 0) return null;
    return doseForWater(waterMl, ratio);
  }, [ratio, waterValue, waterUnit]);

  useEffect(() => {
    onChange?.({
      waterValue,
      waterUnit,
      doseMinMl: dose?.minMl ?? null,
      doseMaxMl: dose?.maxMl ?? null,
    });
  }, [onChange, waterValue, waterUnit, dose]);

  if (!ratio) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <Droplets className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="text-sm text-secondary">
          Dilution <span className="font-semibold text-ink">{dilution}</span>
        </span>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-secondary">Water</span>
          <input
            inputMode="decimal"
            value={waterText}
            onChange={(event) => setWaterText(event.target.value)}
            placeholder="e.g. 15"
            aria-label="Water volume"
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-secondary">Unit</span>
          <select
            value={waterUnit}
            onChange={(event) => setWaterUnit(event.target.value)}
            aria-label="Water unit"
            className="min-h-tap-min rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="rounded-[var(--radius-card)] bg-subtle-fill px-4 py-3 text-sm"
        aria-live="polite"
      >
        {dose ? (
          <p className="text-ink">
            Add{" "}
            <span className="font-semibold text-accent">
              {formatDose(dose, system)}
            </span>{" "}
            to {waterValue} {waterUnit} of water.
          </p>
        ) : (
          <p className="text-muted">
            Enter a water volume to see how much to add.
          </p>
        )}
      </div>
    </div>
  );
}
