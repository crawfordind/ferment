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
