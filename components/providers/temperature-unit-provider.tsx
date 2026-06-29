"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { TemperatureUnit } from "@/lib/temperature";

const STORAGE_KEY = "ferment:temperature-unit";
const DEFAULT_UNIT: TemperatureUnit = "C";

type TemperatureUnitState = {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
};

const TemperatureUnitContext = createContext<TemperatureUnitState>({
  unit: DEFAULT_UNIT,
  setUnit: () => {},
});

/** Read/update the user's preferred temperature unit (persisted per-device). */
export function useTemperatureUnit(): TemperatureUnitState {
  return useContext(TemperatureUnitContext);
}

function readStoredUnit(): TemperatureUnit {
  if (typeof window === "undefined") return DEFAULT_UNIT;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "F" || stored === "C" ? stored : DEFAULT_UNIT;
}

export function TemperatureUnitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start from the default so server and first client render match; the stored
  // preference is applied in an effect to avoid a hydration mismatch.
  const [unit, setUnitState] = useState<TemperatureUnit>(DEFAULT_UNIT);

  useEffect(() => {
    setUnitState(readStoredUnit());
  }, []);

  const setUnit = useCallback((next: TemperatureUnit) => {
    setUnitState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return (
    <TemperatureUnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </TemperatureUnitContext.Provider>
  );
}
