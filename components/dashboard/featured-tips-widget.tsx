"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

import { FERMENT_TIPS } from "@/lib/tips";
import { cn } from "@/lib/utils";
import { Widget } from "./widget";

// Auto-advance interval for the tip carousel.
const ROTATE_MS = 9000;

export function FeaturedTipsWidget() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = FERMENT_TIPS.length;

  // Rotate on a timer; reset the clock whenever the user steps through manually
  // (via `index`) or hovers/focuses to read (via `paused`).
  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, count]);

  if (count === 0) return null;
  const tip = FERMENT_TIPS[index];

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <Widget title="Featured tips" icon={Lightbulb}>
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
          <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            {tip.tag}
          </span>
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

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose tip">
            {FERMENT_TIPS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Tip ${i + 1}: ${t.title}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-accent" : "w-1.5 bg-border hover:bg-secondary",
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
