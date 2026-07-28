"use client";

import { MOUTHFEEL_GROUPS } from "@/lib/flavor-wheel";
import { cn } from "@/lib/utils";

/**
 * Mouthfeel isn't a pick-list — each attribute is a point on an ordered
 * intensity scale (the poster's None → Low → Medium → High). A segmented control
 * per attribute is the honest, tappable representation, grouped by the poster's
 * four quadrants. `ratings` maps attribute key → chosen scale index.
 */
export function MouthfeelScales({
  ratings,
  onRate,
}: {
  ratings: Record<string, number>;
  onRate: (attributeKey: string, index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {MOUTHFEEL_GROUPS.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{
                background: `hsl(${group.hue} ${group.sat}% 52%)`,
              }}
              aria-hidden
            />
            <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
          </div>

          <div className="flex flex-col gap-3">
            {group.attributes.map((attr) => {
              const current = ratings[attr.key];
              return (
                <div key={attr.key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-secondary">
                    {attr.label}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label={attr.label}
                    className="flex flex-wrap gap-1.5"
                  >
                    {attr.scale.map((step, i) => {
                      const active = current === i;
                      return (
                        <button
                          key={step}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => onRate(attr.key, active ? -1 : i)}
                          className={cn(
                            "min-h-tap-min rounded-[var(--radius-chip)] border-2 px-3 py-1.5 text-sm font-medium transition-colors",
                            active
                              ? "border-accent bg-subtle-fill text-ink"
                              : "border-border bg-card text-secondary hover:bg-subtle-fill",
                          )}
                        >
                          {step}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
