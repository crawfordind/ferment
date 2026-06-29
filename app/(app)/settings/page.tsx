"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useTemperatureUnit } from "@/components/providers/temperature-unit-provider";
import {
  TEMPERATURE_UNIT_LABELS,
  unitSuffix,
  type TemperatureUnit,
} from "@/lib/temperature";

const UNIT_OPTIONS: TemperatureUnit[] = ["C", "F"];

export default function SettingsPage() {
  const [locking, setLocking] = useState(false);
  const { unit, setUnit } = useTemperatureUnit();

  async function handleLock() {
    setLocking(true);
    try {
      await fetch("/api/unlock", { method: "DELETE" });
    } catch {
      // Even if the request fails, sending the user to the gate is safe.
    }
    window.location.assign("/unlock");
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <h1 className="text-xl font-bold text-ink">Settings</h1>
      <p className="mt-2 text-secondary">
        Preferences and data export will live here.
      </p>

      <section className="mt-8 border-t border-hairline pt-6">
        <h2 className="text-sm font-semibold text-ink">Temperature unit</h2>
        <p className="mt-1 text-xs text-muted">
          Choose how temperatures are shown and entered. Readings are always
          stored in Celsius and converted automatically.
        </p>
        <div
          role="radiogroup"
          aria-label="Temperature unit"
          className="mt-3 inline-flex rounded-[var(--radius-card)] border-2 border-border p-1"
        >
          {UNIT_OPTIONS.map((option) => {
            const selected = unit === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setUnit(option)}
                className={`min-h-tap-min rounded-[calc(var(--radius-card)-2px)] px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-accent text-white"
                    : "text-secondary hover:text-ink"
                }`}
              >
                {TEMPERATURE_UNIT_LABELS[option]} ({unitSuffix(option)})
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-8 border-t border-hairline pt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={handleLock}
          disabled={locking}
        >
          {locking ? "Locking…" : "Lock app"}
        </Button>
        <p className="mt-2 text-xs text-muted">
          Signs out of this device and returns to the passcode screen.
        </p>
      </div>
    </main>
  );
}
