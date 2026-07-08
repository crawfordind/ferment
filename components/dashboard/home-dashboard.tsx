"use client";

import { useHomeSummary } from "@/hooks/use-home-summary";
import { TriageHero } from "./triage-hero";
import { YourFerments } from "./your-ferments";
import { AmbientInsight } from "./ambient-insight";

/**
 * The data-driven top of Home: hero (triage) → primary (your ferments) →
 * ambient (craft insight). All three read one shared summary so they agree on
 * what needs attention and what's coming next.
 */
export function HomeDashboard() {
  const summary = useHomeSummary();

  return (
    <>
      <TriageHero summary={summary} />
      <YourFerments summary={summary} />
      <AmbientInsight summary={summary} />
    </>
  );
}
