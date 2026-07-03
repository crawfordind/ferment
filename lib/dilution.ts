/**
 * Dilution math for natural-farming inputs. The Knowledge Base stores ratios as
 * human strings like "1:800", "1:800–1:1000", or "1:1000". This turns that ratio
 * plus a water volume into an actual dose ("15 L water → 15 mL FPJ"), which is
 * the bridge that turns a jar of ferment into an applied practice.
 *
 * Pure and dependency-free so it runs offline and is easy to test.
 */

import type { MeasurementSystem } from "./units";

export type DilutionRatio = {
  /** Strongest (smallest denominator) parts of water per 1 part concentrate. */
  min: number;
  /** Weakest (largest denominator) parts of water per 1 part concentrate. */
  max: number;
};

/** Volume units the dose can be requested/expressed in. Base is millilitres. */
const VOLUME_TO_ML: Record<string, number> = {
  l: 1000,
  ml: 1,
  gal: 3785.411784,
  "fl oz": 29.5735295625,
};

/**
 * Parse a dilution string into a {min,max} range of "parts water per 1 part
 * concentrate". Handles "1:800", "1:800-1:1000", "1:800–1:1000" (en dash),
 * "1:1000+", and bare "800". Returns null when nothing usable is found.
 */
export function parseDilutionRatio(
  input: string | null | undefined,
): DilutionRatio | null {
  if (!input) return null;

  // Collect every denominator that appears, whether written "1:800" or "800".
  const denominators: number[] = [];
  const ratioPattern = /1\s*:\s*(\d+(?:\.\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = ratioPattern.exec(input)) !== null) {
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > 0) denominators.push(value);
  }

  // Fall back to bare numbers only if no "1:x" ratios were present.
  if (denominators.length === 0) {
    const barePattern = /(\d+(?:\.\d+)?)/g;
    while ((match = barePattern.exec(input)) !== null) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > 0) denominators.push(value);
    }
  }

  if (denominators.length === 0) return null;

  return {
    min: Math.min(...denominators),
    max: Math.max(...denominators),
  };
}

/** Convert a volume in `unit` to millilitres; null if the unit is unknown. */
export function volumeToMl(
  value: number | null,
  unit: string,
): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  const factor = VOLUME_TO_ML[unit.trim().toLowerCase()];
  return factor === undefined ? null : value * factor;
}

export type DoseRange = {
  /** Concentrate needed at the strongest ratio, in millilitres. */
  minMl: number;
  /** Concentrate needed at the weakest ratio, in millilitres. */
  maxMl: number;
};

/**
 * Concentrate dose (in mL) for a given water volume and dilution range. Water
 * "parts" and concentrate "parts" share a unit, so mL of concentrate = mL of
 * water / denominator.
 */
export function doseForWater(
  waterMl: number,
  ratio: DilutionRatio,
): DoseRange {
  return {
    // A larger denominator = weaker mix = less concentrate.
    minMl: waterMl / ratio.max,
    maxMl: waterMl / ratio.min,
  };
}

/** Round a millilitre dose to a sensible, readable precision. */
export function formatMl(ml: number): string {
  if (!Number.isFinite(ml)) return "—";
  if (ml >= 100) return `${Math.round(ml)} mL`;
  if (ml >= 10) return `${Math.round(ml * 10) / 10} mL`;
  return `${Math.round(ml * 100) / 100} mL`;
}

/** Format a dose range as a single label, collapsing a point range. */
export function formatDoseRange(dose: DoseRange): string {
  const min = formatMl(dose.minMl);
  const max = formatMl(dose.maxMl);
  return min === max ? min : `${min}–${max}`;
}

const ML_PER_FL_OZ = 29.5735295625;

/** Format a fluid-ounce dose, tuned for the small amounts a dose usually is. */
function formatFlOz(ml: number): string {
  if (!Number.isFinite(ml)) return "—";
  const flOz = ml / ML_PER_FL_OZ;
  const rounded = flOz >= 10 ? Math.round(flOz * 10) / 10 : Math.round(flOz * 100) / 100;
  return `${rounded} fl oz`;
}

/**
 * Format a dose range in the unit the user's system uses for small volumes —
 * millilitres for metric, fluid ounces for imperial.
 */
export function formatDose(dose: DoseRange, system: MeasurementSystem): string {
  const fmt = system === "imperial" ? formatFlOz : formatMl;
  const min = fmt(dose.minMl);
  const max = fmt(dose.maxMl);
  return min === max ? min : `${min}–${max}`;
}

/** Units offered in the dilution calculator UI, per measurement system. */
export const WATER_UNITS_METRIC = ["L", "mL"] as const;
export const WATER_UNITS_IMPERIAL = ["gal", "fl oz"] as const;
