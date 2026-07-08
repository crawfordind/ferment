"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

import { useBatches } from "@/hooks/use-batches";
import { FERMENT_TIPS, personalizeTips } from "@/lib/tips";
import { cn } from "@/lib/utils";
import { Widget } from "./widget";

// Auto-advance interval for the tip carousel.
const ROTATE_MS = 9000;
// Keep the carousel short so the dot row stays meaningful — the most relevant
// tips lead after personalisation.
const MAX_TIPS = 4;

export function FeaturedTipsWidget() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const batchesQuery = useBatches();

  // Personalise the order to the shelves the user is actively fermenting, then
  // keep only the top few so the carousel stays short and scannable.
  const { tips, matchedIds } = useMemo(() => {
    const sections = new Set(
      (batchesQuery.data ?? [])
        .filter((b) => b.status === "active")
        .map((b) => b.category),
    );
    const personalized = personalizeTips(FERMENT_TIPS, sections);
    return {
      tips: personalized.tips.slice(0, MAX_TIPS),
      matchedIds: personalized.matchedIds,
    };
  }, [batchesQuery.data]);

  const count = tips.length;

  // Rotate on a timer; reset the clock whenever the user steps through manually
  // (via `index`) or hovers/focuses to read (via `paused`).
  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, count]);

  if (count === 0) return null;
  // Keep the index in range if the personalised list reorders after data loads.
  const safeIndex = index % count;
  const tip = tips[safeIndex];
  const matched = matchedIds.has(tip.id);

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <Widget title="Featured tips" icon={Lightbulb} tone="ambient">
      <div
        className="flex flex-col gap-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          aria-live="polite"
          className="flex min-h-[132px] flex-col gap-1.5 rounded-[var(--radius-card)] bg-subtle-fill p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              {tip.tag}
            </span>
            {matched ? (
              <span className="rounded-[var(--radius-chip)] bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                For your ferments
              </span>
            ) : null}
          </div>
          <p className="text-sm font-bold text-ink">{tip.title}</p>
          <p className="text-sm leading-snug text-secondary">{tip.body}</p>
          {tip.learnMore ? (
            <Link
              href={`/knowledge/${tip.learnMore}`}
              className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Learn more
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {/* Controls: prev/next flank a row of position dots. */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous tip"
            className="flex size-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-subtle-fill hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>

          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="Choose tip"
          >
            {tips.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Tip ${i + 1}: ${t.title}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === safeIndex
                    ? "w-4 bg-accent"
                    : "w-1.5 bg-border hover:bg-secondary",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next tip"
            className="flex size-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-subtle-fill hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </Widget>
  );
}
