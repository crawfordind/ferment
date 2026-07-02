/**
 * Site-wide measurement system preference.
 *
 * A single choice — metric or US/imperial — drives every unit shown in the app:
 * the temperature unit (see `lib/temperature.ts`) and the quantity units offered
 * for recipes, batch size, and yield.
 *
 * Note on storage: temperatures are always persisted in Celsius and converted on
 * the client. Quantity units (kg, lb, …) are stored as explicit labels next to
 * their value, so switching systems changes the *defaults and options offered*
 * for new entries — it never rewrites or reinterprets already-saved amounts.
 */

import type { TemperatureUnit } from "./temperature";

export type MeasurementSystem = "metric" | "imperial";

export const MEASUREMENT_SYSTEM_LABELS: Record<MeasurementSystem, string> = {
  metric: "Metric",
  imperial: "US / Imperial",
};

/** Short example of the units each system uses, for settings copy. */
export const MEASUREMENT_SYSTEM_HINTS: Record<MeasurementSystem, string> = {
  metric: "°C · kg · L",
  imperial: "°F · lb · gal",
};

/** The temperature unit that goes with a measurement system. */
export function temperatureUnitFor(system: MeasurementSystem): TemperatureUnit {
  return system === "imperial" ? "F" : "C";
}

const METRIC_UNITS = ["kg", "g", "L", "ml"];
const IMPERIAL_UNITS = ["lb", "oz", "gal", "fl oz"];

/** Quantity units to offer for the given system. */
export function quantityUnitsFor(system: MeasurementSystem): string[] {
  return system === "imperial" ? [...IMPERIAL_UNITS] : [...METRIC_UNITS];
}

type Dimension = "mass" | "volume";

const UNIT_DIMENSION: Record<string, Dimension> = {
  kg: "mass",
  g: "mass",
  lb: "mass",
  oz: "mass",
  l: "volume",
  ml: "volume",
  gal: "volume",
  "fl oz": "volume",
};

/** Whether a unit measures mass or volume; null if unrecognized. */
export function unitDimension(unit: string): Dimension | null {
  return UNIT_DIMENSION[unit.trim().toLowerCase()] ?? null;
}

// Conversion factors to a base unit (grams for mass, millilitres for volume).
// Keyed lowercase so lookups are case-insensitive ("mL" → "ml", "L" → "l").
const TO_BASE: Record<string, number> = {
  kg: 1000,
  g: 1,
  lb: 453.59237,
  oz: 28.349523125,
  l: 1000,
  ml: 1,
  gal: 3785.411784,
  "fl oz": 29.5735295625,
};

// Units that measure a "small" amount; everything else recognized is "large".
// Converting preserves the tier so a recipe in kg shows as lb (not oz).
const SMALL_UNITS = new Set(["g", "oz", "ml", "fl oz"]);

// The unit to display for each system, dimension, and tier.
const DISPLAY_UNIT: Record<
  MeasurementSystem,
  Record<Dimension, { large: string; small: string }>
> = {
  metric: {
    mass: { large: "kg", small: "g" },
    volume: { large: "L", small: "mL" },
  },
  imperial: {
    mass: { large: "lb", small: "oz" },
    volume: { large: "gal", small: "fl oz" },
  },
};

export type Quantity = { value: number; unit: string };

/**
 * Convert a stored quantity into the unit the user's system displays, keeping
 * the same dimension and size tier. A batch made in `kg` shows as `lb` for an
 * imperial user; a `500 g` input shows as `oz`. Unrecognized units (e.g. a
 * custom "part") pass through untouched — amounts are never silently dropped.
 */
export function convertQuantity(
  value: number,
  unit: string,
  system: MeasurementSystem,
): Quantity {
  const key = unit.trim().toLowerCase();
  const dimension = UNIT_DIMENSION[key];
  const fromFactor = TO_BASE[key];
  if (!dimension || fromFactor === undefined || !Number.isFinite(value)) {
    return { value, unit };
  }

  const tier = SMALL_UNITS.has(key) ? "small" : "large";
  const targetUnit = DISPLAY_UNIT[system][dimension][tier];
  const toFactor = TO_BASE[targetUnit.toLowerCase()];
  return { value: (value * fromFactor) / toFactor, unit: targetUnit };
}

/** Round to at most 2 decimals and drop trailing zeros (5 → "5", 2.2 → "2.2"). */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 100) / 100);
}

/**
 * Convert then format a stored quantity for display in the user's system,
 * e.g. `formatQuantity(5, "kg", "imperial")` → "11.02 lb".
 */
export function formatQuantity(
  value: number,
  unit: string,
  system: MeasurementSystem,
): string {
  const converted = convertQuantity(value, unit, system);
  return `${formatAmount(converted.value)} ${converted.unit}`.trim();
}

const DEFAULT_MASS: Record<MeasurementSystem, string> = {
  metric: "kg",
  imperial: "lb",
};
const DEFAULT_VOLUME: Record<MeasurementSystem, string> = {
  metric: "L",
  imperial: "gal",
};

/** Preferred default unit for a dimension in the given system. */
export function defaultUnitFor(
  dimension: Dimension,
  system: MeasurementSystem,
): string {
  return dimension === "volume" ? DEFAULT_VOLUME[system] : DEFAULT_MASS[system];
}

/**
 * Translate a default unit (e.g. a seed template's metric default) into the
 * user's system, keeping the same dimension. Unknown units pass through.
 */
export function preferredUnit(unit: string, system: MeasurementSystem): string {
  const dimension = unitDimension(unit);
  return dimension ? defaultUnitFor(dimension, system) : unit;
}

/**
 * Units to show in a picker. Always includes `current` so an already-saved
 * value (possibly from the other system) stays selectable when editing.
 */
export function unitOptions(
  system: MeasurementSystem,
  current?: string | null,
): string[] {
  const base = quantityUnitsFor(system);
  if (current && current.trim() && !base.includes(current)) {
    return [current, ...base];
  }
  return base;
}
