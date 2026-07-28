"use client";

import { useMemo, useState } from "react";

import { FlavorWheel } from "@/components/sensory/flavor-wheel";
import { MouthfeelScales } from "@/components/sensory/mouthfeel-scales";
import { haptic } from "@/lib/haptics";
import {
  FLAVOR_WHEEL,
  MOUTHFEEL_GROUPS,
  OFF_FLAVOR_WHEEL,
  parseDescriptorKey,
  type DescriptorWheel,
} from "@/lib/flavor-wheel";
import { cn } from "@/lib/utils";

type Tab = "flavor" | "off" | "mouthfeel";

const TABS: { id: Tab; label: string }[] = [
  { id: "flavor", label: "Flavor" },
  { id: "off", label: "Off-flavors" },
  { id: "mouthfeel", label: "Mouthfeel" },
];

function WheelPanel({ wheel }: { wheel: DescriptorWheel }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFamily, setActiveFamily] = useState<string | null>(null);

  const family = useMemo(
    () => wheel.families.find((f) => f.key === activeFamily) ?? null,
    [wheel, activeFamily],
  );

  function toggle(key: string) {
    haptic();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedList = [...selected]
    .map(parseDescriptorKey)
    .filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-secondary">{wheel.blurb}</p>

      <div className="mx-auto w-full max-w-md">
        <FlavorWheel
          wheel={wheel}
          selected={selected}
          activeFamily={activeFamily}
          onToggleDescriptor={toggle}
          onFocusFamily={(key) => {
            haptic();
            setActiveFamily((prev) => (prev === key ? null : key));
          }}
        />
      </div>

      {/* Drill-down: readable chips for the focused family */}
      {family ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">{family.label}</h3>
            <button
              type="button"
              onClick={() => setActiveFamily(null)}
              className="text-xs font-semibold text-accent"
            >
              Show all families
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {family.descriptors.map((descriptor) => {
              const key = `${wheel.id}:${family.key}:${descriptor}`;
              const isSelected = selected.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(key)}
                  className={cn(
                    "min-h-tap-min rounded-[var(--radius-chip)] border-2 px-3.5 py-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-accent bg-subtle-fill text-ink"
                      : "border-border bg-card text-ink hover:bg-subtle-fill",
                  )}
                  style={
                    isSelected
                      ? {
                          borderColor: `hsl(${family.hue} ${family.sat}% 45%)`,
                        }
                      : undefined
                  }
                >
                  {descriptor}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="text-center text-xs text-muted">
          Tap a colour family to pick its notes — or tap petals directly.
        </p>
      )}

      {/* Selection summary */}
      {selectedList.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-hairline bg-subtle-fill p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
              Selected · {selectedList.length}
            </h3>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-semibold text-accent"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedList.map((d) => (
              <span
                key={`${d.familyKey}:${d.descriptor}`}
                className="inline-flex items-center rounded-[var(--radius-chip)] bg-card px-2 py-0.5 text-xs font-medium text-secondary"
              >
                {d.descriptor}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MouthfeelPanel() {
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const rated = Object.entries(ratings).filter(([, v]) => v >= 0);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-secondary">
        Texture and structure, rated on the poster&apos;s intensity scales — tap
        a step to set it, tap again to clear.
      </p>
      <MouthfeelScales
        ratings={ratings}
        onRate={(key, index) =>
          setRatings((prev) => ({ ...prev, [key]: index }))
        }
      />
      {rated.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-hairline bg-subtle-fill p-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Profile · {rated.length}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {rated.map(([key, index]) => {
              const attr = MOUTHFEEL_GROUPS.flatMap((g) => g.attributes).find(
                (a) => a.key === key,
              );
              if (!attr) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] bg-card px-2 py-0.5 text-xs font-medium text-secondary"
                >
                  <span className="text-muted">{attr.label}:</span>
                  {attr.scale[index]}
                </span>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function SensoryPage() {
  const [tab, setTab] = useState<Tab>("flavor");

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink">Tasting notes</h1>
        <p className="text-sm text-secondary">
          Sensory wheels for evaluating a finished ferment — a working preview.
        </p>
      </header>

      <div className="flex gap-1 rounded-[var(--radius-button)] border border-hairline bg-subtle-fill p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-tap-min flex-1 rounded-[var(--radius-button)] px-3 py-2 text-sm font-semibold transition-colors",
              tab === t.id
                ? "bg-card text-ink shadow-[var(--shadow-sm)]"
                : "text-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "flavor" ? <WheelPanel wheel={FLAVOR_WHEEL} /> : null}
      {tab === "off" ? <WheelPanel wheel={OFF_FLAVOR_WHEEL} /> : null}
      {tab === "mouthfeel" ? <MouthfeelPanel /> : null}

      <p className="mt-2 text-center text-xs text-muted">
        Preview route · not yet wired into batch logging
      </p>
    </main>
  );
}
