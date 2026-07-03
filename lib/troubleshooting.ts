import { getChip } from "@/lib/chips";
import type { FermentType } from "@/lib/schema";

/**
 * In-app troubleshooting for the sensory chips. This is the "is this normal?"
 * companion to Quick Log: beginners abandon natural farming the first time a
 * ferment looks or smells "off" and assume they failed. Each entry either
 * reassures (a scary-looking sign that is usually fine) or warns (a real
 * problem) and always gives a concrete, KNF-grounded next step.
 *
 * Keyed by chip key so it stays in lock-step with `lib/chips.ts`. Content is
 * bundled and works fully offline — no network, no DB.
 */

export type GuidanceTone = "reassure" | "warning";

export type ChipGuidance = {
  /** "reassure" = looks alarming but usually fine; "warning" = act on it. */
  tone: GuidanceTone;
  /** Short headline shown on the guidance card. */
  title: string;
  /** Plain-language explanation of what the sign means. */
  whatItMeans: string;
  /** The concrete next step to take. */
  whatToDo: string;
};

/**
 * Base guidance per chip key. Only chips worth explaining appear here; a chip
 * with no entry (e.g. "Sweet", "Bubbling lots") simply shows no card.
 */
const BASE_GUIDANCE: Record<string, ChipGuidance> = {
  smell_ammonia: {
    tone: "warning",
    title: "Sharp ammonia smell",
    whatItMeans:
      "Proteins are breaking down faster than the sugar and acid can keep up — usually too little sugar, or nitrogen-rich material fermenting too warm.",
    whatToDo:
      "Stir in a spoonful of brown sugar and move the jar somewhere cool and shaded. If the smell fades over the next day it's recovering; if it keeps building, strain and use what's good.",
  },
  smell_rotten: {
    tone: "warning",
    title: "Foul, rotten smell",
    whatItMeans:
      "A putrid rot smell (not a clean sour) means spoilage bacteria have outcompeted the good microbes.",
    whatToDo:
      "If it only just turned and there's no slime, stir in sugar, re-cover, and give it a day. If it's strongly putrid, black, or slimy, discard it and restart with more sugar and a cleaner jar fill — a bad batch won't come back.",
  },
  surface_fuzzy_mold: {
    tone: "warning",
    title: "Fuzzy or colored mold",
    whatItMeans:
      "Fuzzy, raised, or green/black mold on top is contamination — usually too much air space or too little sugar let it take hold.",
    whatToDo:
      "If it's a small spot that just appeared, spoon it off, stir in sugar, and press the material back under the liquid. If the mold has spread through the batch or keeps returning, discard and restart.",
  },
  surface_slime: {
    tone: "warning",
    title: "Slimy or ropey surface",
    whatItMeans:
      "A slippery, stringy, or ropey texture points to the wrong microbes taking over.",
    whatToDo:
      "This is hard to save. If it's mild and early, stir in sugar and keep it cool; if the whole batch is ropey or smells bad, discard and start again.",
  },
  // Neutral-but-alarming signs: reassure, don't warn. This is the single
  // biggest confidence-killer for beginners — a healthy white film looks like
  // failure to a first-timer.
  surface_white_film: {
    tone: "reassure",
    title: "White film on top — usually fine",
    whatItMeans:
      "A thin, flat, white film is typically kahm yeast or a healthy microbial mat. On a sweet-sour smelling ferment it's harmless.",
    whatToDo:
      "Leave it or skim it off — your choice. Keep the material pressed under the liquid. Only worry if it turns fuzzy, raised, or colored, or the smell turns foul.",
  },
};

/**
 * Per-ferment-type overrides where the same sign means something different.
 * Example: a faint ammonia note early in a fish ferment (FAA) is expected as
 * the fish breaks down, not a spoilage alarm.
 */
const TYPE_OVERRIDES: Partial<
  Record<FermentType, Record<string, ChipGuidance>>
> = {
  fish: {
    smell_ammonia: {
      tone: "reassure",
      title: "Ammonia note — expected here",
      whatItMeans:
        "Fish ferments (FAA) smell strong, and a faint ammonia note as the fish breaks down is part of the process. The smell should mellow toward savory-amino over the long ferment.",
      whatToDo:
        "Keep it covered and let it work. Only treat it as a problem if the ammonia grows sharp and dominant instead of fading, or the smell turns putrid.",
    },
  },
};

/** Guidance for a single chip in the context of a ferment type, if any. */
export function getChipGuidance(
  chipKey: string,
  type?: FermentType,
): ChipGuidance | undefined {
  if (type && TYPE_OVERRIDES[type]?.[chipKey]) {
    return TYPE_OVERRIDES[type][chipKey];
  }
  return BASE_GUIDANCE[chipKey];
}

export type ResolvedGuidance = ChipGuidance & { chipKey: string };

/**
 * Resolve guidance for a set of selected chips, warnings first then reassurances,
 * each preserving the order chips are defined in `lib/chips.ts`. Chips with no
 * guidance are dropped.
 */
export function getGuidanceForChips(
  chipKeys: string[],
  type?: FermentType,
): ResolvedGuidance[] {
  const seen = new Set<string>();
  const resolved: ResolvedGuidance[] = [];

  for (const key of chipKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    // Skip unknown chip keys so stale data never surfaces a phantom card.
    if (!getChip(key)) continue;
    const guidance = getChipGuidance(key, type);
    if (guidance) {
      resolved.push({ ...guidance, chipKey: key });
    }
  }

  const rank: Record<GuidanceTone, number> = { warning: 0, reassure: 1 };
  return resolved.sort((a, b) => rank[a.tone] - rank[b.tone]);
}
