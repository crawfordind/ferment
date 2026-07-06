"use client";

import { useEffect, useState } from "react";

// Time-of-day greeting. Because the greeting and date depend on the viewer's
// local clock, we render a stable, neutral heading on the server and first
// client paint, then fill in the personalised copy after mount — this avoids a
// hydration mismatch while still giving a warm, live header.

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const DATE_FMT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export function DashboardGreeting() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const heading = now ? greetingFor(now.getHours()) : "Welcome back";
  const subtitle = now
    ? now.toLocaleDateString(undefined, DATE_FMT)
    : "Your ferments, learning, and what's new — all in one place.";

  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-xl font-bold text-ink">{heading}</h1>
      <p className="text-sm text-secondary">{subtitle}</p>
    </header>
  );
}
