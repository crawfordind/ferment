"use client";

import { useState } from "react";

import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import {
  buildMeasurementSeries,
  METRIC_LABELS,
  type MeasurementMetric,
  type MeasurementSeries,
  type SeriesObservation,
} from "@/lib/measurement-series";
import { fromCelsius, unitSuffix } from "@/lib/temperature";
import { cn } from "@/lib/utils";

const SERIES_COLOR: Record<MeasurementMetric, string> = {
  ph: "var(--accent)",
  brix: "var(--status-watch)",
  tempC: "var(--status-needs-action)",
};

const CHART_W = 320;
const CHART_H = 140;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

function formatMetricValue(
  metric: MeasurementMetric,
  value: number,
  temperatureUnit: "C" | "F",
): string {
  if (metric === "ph") return value.toFixed(1).replace(/\.0$/, "");
  if (metric === "brix") return `${value}°Bx`;
  const display = fromCelsius(value, temperatureUnit);
  return display == null ? "—" : `${display}${unitSuffix(temperatureUnit)}`;
}

function formatSignedDelta(
  metric: MeasurementMetric,
  delta: number,
  temperatureUnit: "C" | "F",
): string {
  if (metric === "tempC") {
    // Delta in °C; convert magnitude for display when user prefers °F.
    const displayDelta =
      temperatureUnit === "F" ? delta * (9 / 5) : delta;
    const rounded = Math.round(displayDelta * 10) / 10;
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}${unitSuffix(temperatureUnit)}`;
  }
  const rounded = Math.round(delta * 100) / 100;
  const sign = rounded > 0 ? "+" : "";
  if (metric === "brix") return `${sign}${rounded}°Bx`;
  return `${sign}${rounded}`;
}

function niceDomain(min: number, max: number): [number, number] {
  if (min === max) {
    const pad = Math.max(0.2, Math.abs(min) * 0.05);
    return [min - pad, max + pad];
  }
  const span = max - min;
  const pad = span * 0.12;
  return [min - pad, max + pad];
}

function TrendChart({
  series,
  temperatureUnit,
}: {
  series: MeasurementSeries;
  temperatureUnit: "C" | "F";
}) {
  const { points, metric, min, max } = series;
  const [yMin, yMax] = niceDomain(min, max);
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const days = points.map((p) => p.day);
  const xMin = Math.min(...days);
  const xMax = Math.max(...days);
  const xSpan = Math.max(1, xMax - xMin);

  function xOf(day: number) {
    return PAD.left + ((day - xMin) / xSpan) * innerW;
  }
  function yOf(value: number) {
    return PAD.top + ((yMax - value) / (yMax - yMin)) * innerH;
  }

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.day)} ${yOf(p.value)}`)
    .join(" ");

  const color = SERIES_COLOR[metric];
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];
  const xLabels =
    xMin === xMax
      ? [xMin]
      : [xMin, Math.round((xMin + xMax) / 2), xMax].filter(
          (v, i, arr) => arr.indexOf(v) === i,
        );

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${METRIC_LABELS[metric]} trend from Day ${xMin} to Day ${xMax}`}
    >
      {/* Horizontal guides */}
      {yTicks.map((tick, i) => {
        const y = yOf(tick);
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={CHART_W - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--hairline)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y + 3}
              textAnchor="end"
              fill="var(--muted)"
              fontSize={9}
              fontWeight={600}
            >
              {metric === "tempC"
                ? (fromCelsius(tick, temperatureUnit) ?? tick).toFixed(0)
                : tick.toFixed(metric === "ph" ? 1 : 0)}
            </text>
          </g>
        );
      })}

      {/* Area fill under the line */}
      {points.length >= 2 ? (
        <path
          d={`${path} L ${xOf(points[points.length - 1].day)} ${PAD.top + innerH} L ${xOf(points[0].day)} ${PAD.top + innerH} Z`}
          fill={color}
          opacity={0.12}
        />
      ) : null}

      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p) => (
        <circle
          key={`${p.observationId}-${p.observedAt}`}
          cx={xOf(p.day)}
          cy={yOf(p.value)}
          r={3.5}
          fill="var(--card)"
          stroke={color}
          strokeWidth={2}
        />
      ))}

      {xLabels.map((day) => (
        <text
          key={day}
          x={xOf(day)}
          y={CHART_H - 8}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize={9}
          fontWeight={600}
        >
          Day {day}
        </text>
      ))}
    </svg>
  );
}

/**
 * Measurement history for a batch: latest values, deltas, and a small SVG
 * trend chart. Replaces the single-snapshot "Latest measurements" card.
 */
export function MeasurementTrends({
  observations,
  startedAt,
}: {
  observations: SeriesObservation[];
  startedAt: number;
}) {
  const { temperatureUnit } = useMeasurementSystem();
  const allSeries = buildMeasurementSeries(observations, startedAt);
  const [active, setActive] = useState<MeasurementMetric | null>(null);

  if (allSeries.length === 0) return null;

  const selected =
    allSeries.find((s) => s.metric === active) ?? allSeries[0];

  return (
    <section className="rounded-[var(--radius-card)] border border-hairline bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          Measurement trends
        </h2>
        {selected.points.length >= 2 ? (
          <span className="text-[11px] font-medium text-secondary">
            {formatSignedDelta(
              selected.metric,
              selected.delta,
              temperatureUnit,
            )}{" "}
            overall
          </span>
        ) : null}
      </div>

      {/* Latest values row */}
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {allSeries.map((s) => (
          <button
            key={s.metric}
            type="button"
            onClick={() => setActive(s.metric)}
            className={cn(
              "flex flex-col items-start rounded-md px-1 py-0.5 text-left transition-colors",
              selected.metric === s.metric
                ? "bg-subtle-fill"
                : "hover:bg-subtle-fill/60",
            )}
          >
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              <span
                className="size-1.5 rounded-full"
                style={{ background: SERIES_COLOR[s.metric] }}
                aria-hidden
              />
              {METRIC_LABELS[s.metric]}
            </span>
            <span className="text-sm font-bold text-ink">
              {formatMetricValue(s.metric, s.latest, temperatureUnit)}
            </span>
          </button>
        ))}
      </div>

      {selected.points.length === 1 ? (
        <p className="rounded-[var(--radius-card)] bg-subtle-fill px-3 py-4 text-center text-xs text-secondary">
          One {METRIC_LABELS[selected.metric]} reading so far — log another to
          see the trend.
        </p>
      ) : (
        <div className="rounded-[var(--radius-card)] bg-subtle-fill/70 px-1 pt-1">
          <TrendChart series={selected} temperatureUnit={temperatureUnit} />
        </div>
      )}
    </section>
  );
}
