"use client";

import { AlertTriangle, Info } from "lucide-react";

import { getGuidanceForChips } from "@/lib/troubleshooting";
import type { FermentType } from "@/lib/schema";
import { cn } from "@/lib/utils";

/**
 * "Is this normal?" guidance for the sensory chips on the current selection or
 * the latest observation. Reassures on scary-but-normal signs (white film) and
 * gives a concrete fix on real problems (ammonia, mold, slime) — the safety net
 * that keeps a first-timer from quitting the moment a ferment looks off.
 */
export function TroubleshootingNote({
  chipKeys,
  type,
  className,
}: {
  chipKeys: string[];
  type?: FermentType;
  className?: string;
}) {
  const guidance = getGuidanceForChips(chipKeys, type);
  if (guidance.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {guidance.map((item) => {
        const warning = item.tone === "warning";
        const Icon = warning ? AlertTriangle : Info;
        return (
          <div
            key={item.chipKey}
            className={cn(
              "flex gap-3 rounded-[var(--radius-card)] border-2 p-3",
              warning
                ? "border-caution-outline bg-caution-selected-fill"
                : "border-hairline bg-subtle-fill",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-5 shrink-0",
                warning ? "text-caution-text" : "text-accent",
              )}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-sm text-secondary">{item.whatItMeans}</p>
              <p className="text-sm text-ink">
                <span className="font-semibold">What to do: </span>
                {item.whatToDo}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
