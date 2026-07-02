import { formatDoseRange, type DoseRange } from "@/lib/dilution";

/**
 * A record of applying a finished ferment to a crop. Stored JSON-encoded in
 * `observations.application`, mirroring the `batches.inputs` pattern — an
 * application is a timeline event on the batch, so it rides the existing
 * offline-first observation sync with no new entity.
 */
export type Application = {
  /** What it was applied to, e.g. "Tomato bed", "Seedling trays". */
  target: string;
  /** The dilution ratio used, as a human label, e.g. "1:1000". */
  dilution?: string | null;
  /** Water volume mixed, in the user's chosen unit. */
  waterValue?: number | null;
  waterUnit?: string | null;
  /** Concentrate dose used, in millilitres (range collapses to a point). */
  doseMinMl?: number | null;
  doseMaxMl?: number | null;
};

/** Parse the JSON `application` column into a typed object, tolerating bad data. */
export function parseApplication(
  json: string | null | undefined,
): Application | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const item = parsed as Record<string, unknown>;
    const target = typeof item.target === "string" ? item.target : "";
    if (target.trim() === "") return null;

    const num = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) ? v : null;

    return {
      target,
      dilution: typeof item.dilution === "string" ? item.dilution : null,
      waterValue: num(item.waterValue),
      waterUnit: typeof item.waterUnit === "string" ? item.waterUnit : null,
      doseMinMl: num(item.doseMinMl),
      doseMaxMl: num(item.doseMaxMl),
    };
  } catch {
    return null;
  }
}

/** Serialize an application to JSON, or null when there is no usable target. */
export function serializeApplication(app: Application): string | null {
  if (app.target.trim() === "") return null;
  return JSON.stringify(app);
}

/** One-line human summary, e.g. "Applied to Tomato bed · 1:1000 · 15 mL in 15 L". */
export function summarizeApplication(app: Application): string {
  const parts: string[] = [`Applied to ${app.target.trim()}`];
  if (app.dilution) parts.push(app.dilution);

  const dose = doseLabel(app);
  const water =
    app.waterValue != null && app.waterUnit
      ? `${app.waterValue} ${app.waterUnit}`
      : null;
  if (dose && water) parts.push(`${dose} in ${water}`);
  else if (water) parts.push(water);

  return parts.join(" · ");
}

/** The concentrate dose as a readable label, or null if none was recorded. */
export function doseLabel(app: Application): string | null {
  if (app.doseMinMl == null && app.doseMaxMl == null) return null;
  const range: DoseRange = {
    minMl: app.doseMinMl ?? app.doseMaxMl ?? 0,
    maxMl: app.doseMaxMl ?? app.doseMinMl ?? 0,
  };
  return formatDoseRange(range);
}
