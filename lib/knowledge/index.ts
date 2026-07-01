import { KNOWLEDGE_DOCS } from "./generated";
import type { KbCategory, KnowledgeDoc, NutritiveStage } from "./types";

export type { KnowledgeDoc, NutritiveStage, KbStep, KbIngredient, KbCategory, KbSource } from "./types";

export const CATEGORY_META: Record<KbCategory, { label: string }> = {
  "microbial-culture": { label: "Microbial culture" },
  "plant-ferment": { label: "Plant ferment" },
  "fruit-ferment": { label: "Fruit ferment" },
  "mineral-extract": { label: "Mineral extract" },
  "amino-acid": { label: "Amino acid" },
  "liquid-fertilizer": { label: "Liquid fertilizer" },
  "solid-fertilizer": { label: "Solid fertilizer" },
  "pest-control": { label: "Pest control" },
  biostimulant: { label: "Biostimulant" },
  concept: { label: "Concept" },
  application: { label: "Application" },
};

export const SOURCE_LABELS: Record<string, string> = {
  KNF: "Master Cho · KNF",
  MM: "Mountain Microorganisms",
  SoilLandFood: "Soil Land Food",
};

const DIFFICULTY_LABELS = ["", "Easy", "Moderate", "Advanced"];
export function difficultyLabel(difficulty: number): string {
  return DIFFICULTY_LABELS[difficulty] ?? "";
}

export function getAllDocs(): KnowledgeDoc[] {
  return KNOWLEDGE_DOCS;
}

export function getDoc(id: string): KnowledgeDoc | undefined {
  return KNOWLEDGE_DOCS.find((d) => d.id === id);
}

/** Human-facing order + labels for the Nutritive Cycle stages. */
export const STAGE_META: Record<NutritiveStage, { label: string; short: string; order: number }> = {
  vegetative: { label: "Vegetative growth", short: "Grow (N)", order: 1 },
  "cross-over": { label: "Cross-over / flowering", short: "Flower (P)", order: 2 },
  reproductive: { label: "Reproductive / fruiting", short: "Fruit (K)", order: 3 },
  "all-stages": { label: "Backbone (all stages)", short: "All stages", order: 4 },
  soil: { label: "Soil & compost", short: "Soil", order: 5 },
};

/** Lightweight ranked search over the pre-built haystack. No deps, runs offline. */
export function searchDocs(query: string, docs: KnowledgeDoc[] = KNOWLEDGE_DOCS): KnowledgeDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs;
  const terms = q.split(/\s+/);
  return docs
    .map((doc) => {
      let score = 0;
      for (const term of terms) {
        const inTitle = doc.title.toLowerCase().includes(term) || (doc.abbr?.toLowerCase().includes(term) ?? false);
        const inHaystack = doc.searchText.includes(term);
        if (inTitle) score += 10;
        else if (inHaystack) score += 1;
        else return null; // every term must match somewhere
      }
      return { doc, score };
    })
    .filter((r): r is { doc: KnowledgeDoc; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.doc);
}
