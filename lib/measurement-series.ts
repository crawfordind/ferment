import { computeDayInProcess } from "@/lib/day";

export type MeasurementMetric = "ph" | "brix" | "tempC";

export type MeasurementPoint = {
  /** Observation id (for linking). */
  observationId: string;
  observedAt: number;
  day: number;
  value: number;
};

export type MeasurementSeries = {
  metric: MeasurementMetric;
  points: MeasurementPoint[];
  latest: number;
  first: number;
  delta: number;
  min: number;
  max: number;
};

export type SeriesObservation = {
  id: string;
  observedAt: number;
  ph?: number | null;
  brix?: number | null;
  tempC?: number | null;
};

const METRIC_ORDER: MeasurementMetric[] = ["ph", "brix", "tempC"];

/** Build chronological series for every metric that has at least one reading. */
export function buildMeasurementSeries(
  observations: SeriesObservation[],
  startedAt: number,
): MeasurementSeries[] {
  const series: MeasurementSeries[] = [];

  for (const metric of METRIC_ORDER) {
    const points: MeasurementPoint[] = [];
    for (const o of observations) {
      const value = o[metric];
      if (value == null || !Number.isFinite(value)) continue;
      points.push({
        observationId: o.id,
        observedAt: o.observedAt,
        day: computeDayInProcess(startedAt, o.observedAt),
        value,
      });
    }
    if (points.length === 0) continue;
    points.sort((a, b) => a.observedAt - b.observedAt);
    const values = points.map((p) => p.value);
    const first = values[0];
    const latest = values[values.length - 1];
    series.push({
      metric,
      points,
      latest,
      first,
      delta: latest - first,
      min: Math.min(...values),
      max: Math.max(...values),
    });
  }

  return series;
}

export const METRIC_LABELS: Record<MeasurementMetric, string> = {
  ph: "pH",
  brix: "Brix",
  tempC: "Temp",
};
