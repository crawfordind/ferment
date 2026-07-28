"use client";

import { useMemo } from "react";

import type { DescriptorWheel, WheelFamily } from "@/lib/flavor-wheel";
import { descriptorKey, totalDescriptors } from "@/lib/flavor-wheel";
import { cn } from "@/lib/utils";

/**
 * An interactive radial "flavor wheel", modelled on the KBI sensory posters.
 * The inner ring is the colour families; the outer ring is tappable descriptor
 * petals. Tapping a family focuses it (dimming the rest) so the companion chip
 * panel can show its notes at a readable size — the wheel stays the hero visual,
 * the chips do the precise selecting. Petals are also directly tappable.
 *
 * Geometry is a plain sunburst: 0° points up, angle increases clockwise, and
 * every descriptor gets an equal angular slice (like the poster's petals).
 */

const SIZE = 800;
const C = SIZE / 2;
const HUB_R = 78; // centre hub radius
const FAMILY_R = 202; // outer edge of the family ring (radial labels need room)
const PETAL_R = 384; // outer edge of the descriptor ring
const GAP_DEG = 0.6; // tiny gap between petals

function polar(r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

/** A ring segment (annular wedge) between two radii and two angles. */
function ringPath(
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number,
): string {
  const [x0, y0] = polar(rOuter, a0);
  const [x1, y1] = polar(rOuter, a1);
  const [x2, y2] = polar(rInner, a1);
  const [x3, y3] = polar(rInner, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${x0} ${y0}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

function shade(family: WheelFamily, index: number, count: number): string {
  // Lighter toward the rim so each family reads as its own gradient.
  const t = count > 1 ? index / (count - 1) : 0;
  const light = 40 + t * 22;
  return `hsl(${family.hue} ${family.sat}% ${light}%)`;
}

type Petal = {
  key: string;
  family: WheelFamily;
  descriptor: string;
  a0: number;
  a1: number;
  mid: number;
  fill: string;
};

export function FlavorWheel({
  wheel,
  selected,
  activeFamily,
  onToggleDescriptor,
  onFocusFamily,
  className,
}: {
  wheel: DescriptorWheel;
  selected: Set<string>;
  activeFamily: string | null;
  onToggleDescriptor: (key: string) => void;
  onFocusFamily: (familyKey: string) => void;
  className?: string;
}) {
  const per = 360 / totalDescriptors(wheel);

  const { petals, families } = useMemo(() => {
    const petals: Petal[] = [];
    const families: { family: WheelFamily; a0: number; a1: number }[] = [];
    let angle = 0;
    for (const family of wheel.families) {
      const start = angle;
      family.descriptors.forEach((descriptor, i) => {
        const a0 = angle + GAP_DEG / 2;
        const a1 = angle + per - GAP_DEG / 2;
        petals.push({
          key: descriptorKey(wheel.id, family.key, descriptor),
          family,
          descriptor,
          a0,
          a1,
          mid: (a0 + a1) / 2,
          fill: shade(family, i, family.descriptors.length),
        });
        angle += per;
      });
      families.push({ family, a0: start, a1: angle });
    }
    return { petals, families };
  }, [wheel, per]);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn("h-auto w-full select-none", className)}
      role="group"
      aria-label={`${wheel.title} wheel`}
    >
      {/* Family ring — labels run radially along each family's mid-spoke, kept
          upright on the left half (matching the KBI posters). */}
      {families.map(({ family, a0, a1 }) => {
        const isActive = activeFamily === family.key;
        const dim = activeFamily != null && !isActive;
        const mid = (a0 + a1) / 2;
        const flip = mid > 180;
        const labelTransform = `rotate(${mid} ${C} ${C}) translate(${C} ${
          C - (HUB_R + FAMILY_R) / 2
        }) rotate(${flip ? 90 : -90})`;
        return (
          <g
            key={family.key}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={`Focus ${family.label}`}
            className="cursor-pointer outline-none"
            onClick={() => onFocusFamily(family.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFocusFamily(family.key);
              }
            }}
            style={{ opacity: dim ? 0.4 : 1 }}
          >
            <path
              d={ringPath(HUB_R, FAMILY_R, a0, a1)}
              fill={`hsl(${family.hue} ${family.sat}% ${isActive ? 30 : 34}%)`}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth={1}
            />
            <text
              transform={labelTransform}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none fill-white font-semibold"
              style={{
                fontSize: 16,
                paintOrder: "stroke",
                stroke: "rgba(0,0,0,0.3)",
                strokeWidth: 2.5,
              }}
            >
              {family.label}
            </text>
          </g>
        );
      })}

      {/* Descriptor petals */}
      {petals.map((petal) => {
        const isSelected = selected.has(petal.key);
        const dim = activeFamily != null && activeFamily !== petal.family.key;
        const flip = petal.mid > 180;
        // Radial label along the petal's spoke, kept upright on the left half.
        const labelTransform = `rotate(${petal.mid} ${C} ${C}) translate(${C} ${
          C - (FAMILY_R + 8)
        }) rotate(${flip ? 90 : -90})`;
        return (
          <g
            key={petal.key}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${petal.descriptor} (${petal.family.label})`}
            className="cursor-pointer outline-none"
            onClick={() => onToggleDescriptor(petal.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleDescriptor(petal.key);
              }
            }}
            style={{ opacity: dim ? 0.25 : 1 }}
          >
            <path
              d={ringPath(FAMILY_R, PETAL_R, petal.a0, petal.a1)}
              fill={petal.fill}
              stroke={isSelected ? "var(--ink-border)" : "rgba(0,0,0,0.12)"}
              strokeWidth={isSelected ? 3 : 0.75}
              style={{ filter: isSelected ? "brightness(1.12)" : undefined }}
            />
            <text
              transform={labelTransform}
              textAnchor={flip ? "end" : "start"}
              dominantBaseline="middle"
              className="pointer-events-none fill-white"
              style={{
                fontSize: 10,
                fontWeight: isSelected ? 700 : 500,
                paintOrder: "stroke",
                stroke: "rgba(0,0,0,0.32)",
                strokeWidth: 2,
              }}
            >
              {petal.descriptor}
            </text>
          </g>
        );
      })}

      {/* Centre hub */}
      <circle
        cx={C}
        cy={C}
        r={HUB_R - 6}
        fill="var(--card)"
        stroke="var(--hairline)"
        strokeWidth={2}
      />
      <text
        x={C}
        y={C}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-ink font-bold"
        style={{ fontSize: 20 }}
      >
        {wheel.hub.split(" ").map((word, i, arr) => (
          <tspan
            key={word + i}
            x={C}
            dy={i === 0 ? `-${(arr.length - 1) * 0.6}em` : "1.2em"}
          >
            {word}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
