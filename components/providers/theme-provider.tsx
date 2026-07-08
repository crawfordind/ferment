"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "ferment:theme";
const DEFAULT_CHOICE: ThemeChoice = "system";

type ThemeState = {
  /** The user's setting: light, dark, or follow-the-system. */
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
  /** The theme actually applied right now ("light" | "dark"). */
  resolved: "light" | "dark";
};

const ThemeContext = createContext<ThemeState>({
  choice: DEFAULT_CHOICE,
  setChoice: () => {},
  resolved: "light",
});

export function useTheme(): ThemeState {
  return useContext(ThemeContext);
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") return systemPrefersDark() ? "dark" : "light";
  return choice;
}

/** Toggle the `dark` class the CSS keys off of. */
function apply(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start neutral so SSR and first paint agree; the stored choice is applied in
  // an effect. The pre-paint script in <head> prevents a flash before this runs.
  const [choice, setChoiceState] = useState<ThemeChoice>(DEFAULT_CHOICE);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ThemeChoice =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : DEFAULT_CHOICE;
    setChoiceState(initial);
    const next = resolve(initial);
    setResolved(next);
    apply(next);
  }, []);

  // When following the system, react to OS light/dark changes live.
  useEffect(() => {
    if (choice !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemPrefersDark() ? "dark" : "light";
      setResolved(next);
      apply(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const r = resolve(next);
    setResolved(r);
    apply(r);
  }, []);

  const value = useMemo<ThemeState>(
    () => ({ choice, setChoice, resolved }),
    [choice, setChoice, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
