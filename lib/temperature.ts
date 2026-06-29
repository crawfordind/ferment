/**
 * Temperature helpers.
 *
 * Readings are always persisted in Celsius (the `temp_c` column). These helpers
 * exist purely so the UI can present and collect temperatures in whichever unit
 * the user prefers — conversion happens on the client, never in the database.
 */

export type TemperatureUnit = "C" | "F";

export const TEMPERATURE_UNIT_LABELS: Record<TemperatureUnit, string> = {
  C: "Celsius",
  F: "Fahrenheit",
};

/** Short suffix shown next to a value, e.g. `21.5°C`. */
export function unitSuffix(unit: TemperatureUnit): string {
  return unit === "F" ? "°F" : "°C";
}

export function celsiusToFahrenheit(celsius: number): number {
  return celsius * (9 / 5) + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * (5 / 9);
}

/** Round to one decimal place, dropping a trailing `.0`. */
function roundForDisplay(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Convert a stored Celsius reading into the user's preferred unit, rounded for
 * display. Returns `null` when there is no reading.
 */
export function fromCelsius(
  tempC: number | null | undefined,
  unit: TemperatureUnit,
): number | null {
  if (tempC == null) return null;
  const value = unit === "F" ? celsiusToFahrenheit(tempC) : tempC;
  return roundForDisplay(value);
}

/**
 * Convert a value the user typed in their preferred unit back into Celsius for
 * storage. Returns `null` for blank/invalid input.
 */
export function toCelsius(
  value: number | null | undefined,
  unit: TemperatureUnit,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return unit === "F" ? fahrenheitToCelsius(value) : value;
}

/** Format a stored Celsius reading as a display string, e.g. `70.7°F`. */
export function formatTemperature(
  tempC: number | null | undefined,
  unit: TemperatureUnit,
): string | null {
  const value = fromCelsius(tempC, unit);
  if (value == null) return null;
  return `${value}${unitSuffix(unit)}`;
}
