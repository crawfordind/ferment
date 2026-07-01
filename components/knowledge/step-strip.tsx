import {
  Apple,
  Banana,
  Beaker,
  Blend,
  Bone,
  Bug,
  Carrot,
  Cherry,
  CircleDot,
  Citrus,
  Clock,
  Container,
  Droplet,
  Droplets,
  Egg,
  Filter,
  FlaskConical,
  Flame,
  Funnel,
  Grape,
  Hand,
  Layers,
  Leaf,
  Milk,
  Fish,
  Mountain,
  Package,
  Scale,
  Search,
  Shovel,
  Snowflake,
  Sparkles,
  SprayCan,
  Sprout,
  Sun,
  TestTube,
  Thermometer,
  Trees,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { KbStep } from "@/lib/knowledge/types";

// Semantic step-icon vocabulary. Content authors reference these keys in each
// recipe's `steps[].icon`. Unknown keys fall back to a neutral dot.
const STEP_ICONS: Record<string, LucideIcon> = {
  gather: Leaf,
  plant: Sprout,
  herb: Sprout,
  fruit: Apple,
  banana: Banana,
  grape: Grape,
  cherry: Cherry,
  citrus: Citrus,
  carrot: Carrot,
  milk: Milk,
  fish: Fish,
  egg: Egg,
  bone: Bone,
  weigh: Scale,
  mix: Blend,
  hand: Hand,
  layer: Layers,
  pack: Package,
  jar: Container,
  beaker: Beaker,
  flask: FlaskConical,
  testtube: TestTube,
  cover: CircleDot,
  weight: CircleDot,
  air: Wind,
  seal: Package,
  char: Flame,
  roast: Flame,
  dissolve: Droplets,
  water: Droplet,
  addwater: Droplets,
  sugar: Sparkles,
  molasses: Droplet,
  clock: Clock,
  wait: Clock,
  strain: Filter,
  funnel: Funnel,
  store: Snowflake,
  cool: Snowflake,
  sun: Sun,
  mountain: Mountain,
  soil: Mountain,
  shovel: Shovel,
  compost: Trees,
  spray: SprayCan,
  pest: Bug,
  seawater: Waves,
  temp: Thermometer,
  check: Search,
};

/**
 * A vertical, connected process diagram. Each step is an icon badge on a
 * timeline rail with a numbered instruction — a phone-first "how to make it"
 * visual that is generated from structured data, so every recipe gets a
 * consistent diagram for free.
 */
export function StepStrip({ steps }: { steps: KbStep[] }) {
  if (steps.length === 0) return null;
  return (
    <ol className="relative flex flex-col">
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[step.icon] ?? CircleDot;
        const isLast = i === steps.length - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {/* rail */}
            {!isLast && (
              <span aria-hidden className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-hairline" />
            )}
            {/* icon badge */}
            <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink-border bg-subtle-fill">
              <Icon className="size-5 text-accent" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Step {i + 1}</span>
              <p className="text-sm leading-snug text-ink">{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
