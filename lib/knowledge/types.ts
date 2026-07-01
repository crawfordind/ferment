// Knowledge Base types. This is STATIC reference content — it never touches the
// batch DB, Dexie, or the outbox. Recipes are authored as portable `.md` files in
// `content/knowledge/` and compiled at build time into `generated.ts` (see
// `scripts/build-knowledge.ts`), so the whole library ships bundled and works offline.

/** Master Cho's Nutritive Cycle stage(s) a recipe serves. */
export type NutritiveStage =
  | "vegetative" // young: builds roots & leaves (C→N)
  | "cross-over" // "morning sickness": flowering, craves sour (P)
  | "reproductive" // fruiting & color (K)
  | "all-stages" // backbone inputs used throughout (OHN, BRV, IMO…)
  | "soil"; // soil / compost conditioning

export type KbSource = "KNF" | "MM" | "SoilLandFood";

export type KbCategory =
  | "microbial-culture"
  | "plant-ferment"
  | "fruit-ferment"
  | "mineral-extract"
  | "amino-acid"
  | "liquid-fertilizer"
  | "solid-fertilizer"
  | "pest-control"
  | "biostimulant"
  | "concept"
  | "application";

/** One illustrated step in the StepStrip diagram. `icon` is a StepIcon key. */
export type KbStep = { icon: string; text: string };

export type KbIngredient = { item: string; qty?: string; unit?: string };

export type KnowledgeDoc = {
  id: string;
  title: string;
  abbr?: string;
  source: KbSource;
  category: KbCategory;
  stage: NutritiveStage[];
  /** Nutrients / functions this input supplies (e.g. "nitrogen", "microbes"). */
  supplies: string[];
  difficulty: 1 | 2 | 3;
  /** Active fermentation window [min, max] days, or null for concept pages. */
  timeDays: [number, number] | null;
  dilution?: string;
  summary: string;
  /** If set, "Start a batch from this recipe" deep-links /new with this FermentType. */
  fermentType?: string;
  ingredients: KbIngredient[];
  steps: KbStep[];
  tags: string[];
  related: string[];
  /** Markdown body pre-rendered to HTML at build time. */
  bodyHtml: string;
  /** Lowercased haystack for instant client-side search. */
  searchText: string;
};

export type KnowledgeIndexEntry = Pick<
  KnowledgeDoc,
  "id" | "title" | "abbr" | "source" | "category" | "stage" | "supplies" | "difficulty" | "summary" | "tags"
>;
