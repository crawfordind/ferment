"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { TemperatureUnit } from "@/lib/temperature";
import { type MeasurementSystem, temperatureUnitFor } from "@/lib/units";

const STORAGE_KEY = "ferment:measurement-system";
const DEFAULT_SYSTEM: MeasurementSystem = "metric";

type MeasurementSystemState = {
  system: MeasurementSystem;
  setSystem: (system: MeasurementSystem) => void;
  /** Temperature unit derived from the system — metric → °C, imperial → °F. */
  temperatureUnit: TemperatureUnit;
};

const MeasurementSystemContext = createContext<MeasurementSystemState>({
  system: DEFAULT_SYSTEM,
  setSystem: () => {},
  temperatureUnit: temperatureUnitFor(DEFAULT_SYSTEM),
});

/** Read/update the app-wide measurement system (persisted per-device). */
export function useMeasurementSystem(): MeasurementSystemState {
  return useContext(MeasurementSystemContext);
}

function readStoredSystem(): MeasurementSystem {
  if (typeof window === "undefined") return DEFAULT_SYSTEM;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "metric" || stored === "imperial" ? stored : DEFAULT_SYSTEM;
}

export function MeasurementSystemProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start from the default so server and first client render match; the stored
  // preference is applied in an effect to avoid a hydration mismatch.
  const [system, setSystemState] = useState<MeasurementSystem>(DEFAULT_SYSTEM);

  useEffect(() => {
    setSystemState(readStoredSystem());
  }, []);

  const setSystem = useCallback((next: MeasurementSystem) => {
    setSystemState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = useMemo<MeasurementSystemState>(
    () => ({ system, setSystem, temperatureUnit: temperatureUnitFor(system) }),
    [system, setSystem],
  );

  return (
    <MeasurementSystemContext.Provider value={value}>
      {children}
    </MeasurementSystemContext.Provider>
  );
}
