"use client";

import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import type { BatchPulse, MeasurementDelta } from "@/lib/batch-pulse";
import { fromCelsius, unitSuffix } from "@/lib/temperature";

function formatDelta(
  delta: MeasurementDelta,
  temperatureUnit: "C" | "F",
): string {
  const label =
    delta.metric === "ph" ? "pH" : delta.metric === "brix" ? "Brix" : "Temp";

  if (delta.metric === "tempC") {
    const from = fromCelsius(delta.from, temperatureUnit);
    const to = fromCelsius(delta.to, temperatureUnit);
    const displayDelta =
      temperatureUnit === "F" ? delta.delta * (9 / 5) : delta.delta;
    const rounded = Math.round(displayDelta * 10) / 10;
    const sign = rounded > 0 ? "+" : "";
    const suffix = unitSuffix(temperatureUnit);
    return `${label} ${from}${suffix} → ${to}${suffix} (${sign}${rounded}${suffix} since Day ${delta.fromDay})`;
  }

  const sign = delta.delta > 0 ? "+" : "";
  const rounded =
    Math.abs(delta.delta) >= 10
      ? delta.delta.toFixed(0)
      : delta.delta.toFixed(1).replace(/\.0$/, "");
  const unit = delta.metric === "brix" ? "°Bx" : "";

  return `${label} ${delta.from}${unit} → ${delta.to}${unit} (${sign}${rounded}${unit} since Day ${delta.fromDay})`;
}

/**
 * Factual callout that replaced "What to expect today": check-in cadence,
 * measured change, and the next scheduled milestone — no speculative prose.
 */
export function BatchPulseCard({ pulse }: { pulse: BatchPulse }) {
  const { temperatureUnit } = useMeasurementSystem();

  if (pulse.observationCount === 0 && !pulse.nextLine && !pulse.healthLine) {
    return (
      <section className="rounded-[var(--radius-card)] border-l-4 border-accent bg-subtle-fill px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-accent">
          At a glance
        </p>
        <p className="mt-1.5 text-sm leading-snug text-ink">
          {pulse.checkInLine}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-card)] border-l-4 border-accent bg-subtle-fill px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-accent">
        At a glance
      </p>

      <p className="mt-1.5 text-sm leading-snug text-ink">{pulse.checkInLine}</p>

      {pulse.measurement ? (
        <p className="mt-1 text-sm font-medium text-ink">
          {formatDelta(pulse.measurement, temperatureUnit)}
        </p>
      ) : null}

      {pulse.nextLine ? (
        <p className="mt-2 border-t border-hairline pt-2 text-xs font-semibold text-secondary">
          Next · {pulse.nextLine}
        </p>
      ) : pulse.observationCount > 0 ? (
        <p className="mt-2 border-t border-hairline pt-2 text-xs text-secondary">
          {pulse.observationCount} check-in
          {pulse.observationCount === 1 ? "" : "s"} on record
        </p>
      ) : null}

      {pulse.healthLine ? (
        <p className="mt-1.5 text-xs font-medium text-status-needs-action-text">
          {pulse.healthLine}
        </p>
      ) : null}
    </section>
  );
}
