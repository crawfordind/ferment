"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useMeasurementSystem } from "@/components/providers/measurement-system-provider";
import {
  useTheme,
  type ThemeChoice,
} from "@/components/providers/theme-provider";
import {
  MEASUREMENT_SYSTEM_HINTS,
  MEASUREMENT_SYSTEM_LABELS,
  type MeasurementSystem,
} from "@/lib/units";

const SYSTEM_OPTIONS: MeasurementSystem[] = ["metric", "imperial"];

const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsPage() {
  const [locking, setLocking] = useState(false);
  const { system, setSystem } = useMeasurementSystem();
  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme();

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
        <h2 className="text-sm font-semibold text-ink">Appearance</h2>
        <p className="mt-1 text-xs text-muted">
          Choose a light or dark theme, or follow your device setting.
        </p>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="mt-3 inline-flex rounded-[var(--radius-card)] border-2 border-border p-1"
        >
          {THEME_OPTIONS.map((option) => {
            const selected = themeChoice === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setThemeChoice(option.value)}
                className={`min-h-tap-min rounded-[calc(var(--radius-card)-2px)] px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-accent text-white"
                    : "text-secondary hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 border-t border-hairline pt-6">
        <h2 className="text-sm font-semibold text-ink">Measurement system</h2>
        <p className="mt-1 text-xs text-muted">
          Sets the units used throughout the app — temperature, batch size,
          yield, and recipe amounts. Temperatures are always stored in Celsius
          and converted automatically; existing amounts keep the unit they were
          saved with.
        </p>
        <div
          role="radiogroup"
          aria-label="Measurement system"
          className="mt-3 inline-flex rounded-[var(--radius-card)] border-2 border-border p-1"
        >
          {SYSTEM_OPTIONS.map((option) => {
            const selected = system === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSystem(option)}
                className={`min-h-tap-min rounded-[calc(var(--radius-card)-2px)] px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-accent text-white"
                    : "text-secondary hover:text-ink"
                }`}
              >
                {MEASUREMENT_SYSTEM_LABELS[option]}
                <span
                  className={`ml-2 text-xs ${selected ? "text-white/80" : "text-muted"}`}
                >
                  {MEASUREMENT_SYSTEM_HINTS[option]}
                </span>
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
