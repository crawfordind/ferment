import type { FermentType } from "@/lib/schema";

export type SeedTemplate = {
  id: string;
  type: FermentType;
  category: string;
  name: string;
  defaultUnit: string;
  stages: {
    id: string;
    stageIndex: number;
    name: string;
    dayStart: number;
    dayEnd: number | null;
    expectationText: string;
    actionLabel: string | null;
  }[];
};

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    id: "tpl-fpj",
    type: "fpj",
    category: "fertilizer",
    name: "Fermented Plant Juice (FPJ)",
    defaultUnit: "kg",
    stages: [
      {
        id: "stage-fpj-0",
        stageIndex: 0,
        name: "Soak",
        dayStart: 0,
        dayEnd: 2,
        expectationText:
          "Day 0–2: plant material submerged in brown sugar. Should smell sweet, not rotten. Keep covered out of direct sun.",
        actionLabel: null,
      },
      {
        id: "stage-fpj-1",
        stageIndex: 1,
        name: "Active ferment",
        dayStart: 3,
        dayEnd: 6,
        expectationText:
          "Day 3–6: should smell sweet and sour with steady bubbling. Flag ammonia or rotten smells.",
        actionLabel: "Check daily",
      },
      {
        id: "stage-fpj-2",
        stageIndex: 2,
        name: "Strain",
        dayStart: 7,
        dayEnd: 7,
        expectationText:
          "Day 7: bubbling slows. Strain solids and store liquid. Sweet-sour smell is good; rotten is not.",
        actionLabel: "Strain",
      },
    ],
  },
  {
    id: "tpl-ffj",
    type: "ffj",
    category: "fertilizer",
    name: "Fermented Fruit Juice (FFJ)",
    defaultUnit: "kg",
    stages: [
      {
        id: "stage-ffj-0",
        stageIndex: 0,
        name: "Mix",
        dayStart: 0,
        dayEnd: 1,
        expectationText:
          "Day 0–1: fruit and sugar mixed. Should smell fruity and sweet. Keep anaerobic.",
        actionLabel: null,
      },
      {
        id: "stage-ffj-1",
        stageIndex: 1,
        name: "Active ferment",
        dayStart: 2,
        dayEnd: 6,
        expectationText:
          "Day 2–6: sweet-sour fruit smell with bubbles. Watch for boozy over-ferment or slime on surface.",
        actionLabel: "Check daily",
      },
      {
        id: "stage-ffj-2",
        stageIndex: 2,
        name: "Strain",
        dayStart: 7,
        dayEnd: 7,
        expectationText:
          "Day 7: strain and bottle. Liquid should be clear amber with a pleasant sour note.",
        actionLabel: "Strain",
      },
    ],
  },
  {
    id: "tpl-labs",
    type: "labs",
    category: "fertilizer",
    name: "LABS (Lactic Acid Bacteria Serum)",
    defaultUnit: "L",
    stages: [
      {
        id: "stage-labs-0",
        stageIndex: 0,
        name: "Rice wash",
        dayStart: 0,
        dayEnd: 2,
        expectationText:
          "Day 0–2: rice wash collecting. Mild sour smell developing. Keep loosely covered.",
        actionLabel: null,
      },
      {
        id: "stage-labs-1",
        stageIndex: 1,
        name: "Milk ferment",
        dayStart: 3,
        dayEnd: 5,
        expectationText:
          "Day 3–5: curds separate from whey. Sour dairy smell is normal. Flag strong ammonia.",
        actionLabel: "Skim curds",
      },
      {
        id: "stage-labs-2",
        stageIndex: 2,
        name: "Collect serum",
        dayStart: 6,
        dayEnd: 6,
        expectationText:
          "Day 6: collect clear whey serum. Should smell clean and lactic, not rotten.",
        actionLabel: "Collect",
      },
    ],
  },
  {
    id: "tpl-fish",
    type: "fish",
    category: "fertilizer",
    name: "Fish Amino Acid (FAA)",
    defaultUnit: "kg",
    stages: [
      {
        id: "stage-fish-0",
        stageIndex: 0,
        name: "Layer and press",
        dayStart: 0,
        dayEnd: 3,
        expectationText:
          "Day 0–3: fish layered with sugar. Strong fish smell expected; should not smell rotten yet.",
        actionLabel: null,
      },
      {
        id: "stage-fish-1",
        stageIndex: 1,
        name: "Long ferment",
        dayStart: 4,
        dayEnd: 90,
        expectationText:
          "Day 4–90: slow breakdown. Smell shifts from fishy to savory-amino. Flag ammonia or putrid rot.",
        actionLabel: "Check monthly",
      },
      {
        id: "stage-fish-2",
        stageIndex: 2,
        name: "Harvest",
        dayStart: 91,
        dayEnd: 91,
        expectationText:
          "Day 91+: liquid should be dark amber with a rich amino smell. Strain and bottle.",
        actionLabel: "Strain",
      },
    ],
  },
  {
    id: "tpl-plant",
    type: "plant",
    category: "fertilizer",
    name: "Plant Ferment (JLF-style)",
    defaultUnit: "kg",
    stages: [
      {
        id: "stage-plant-0",
        stageIndex: 0,
        name: "Submerge",
        dayStart: 0,
        dayEnd: 7,
        expectationText:
          "Day 0–7: plant material submerged in water. Earthy smell developing. Keep anaerobic.",
        actionLabel: null,
      },
      {
        id: "stage-plant-1",
        stageIndex: 1,
        name: "Long soak",
        dayStart: 8,
        dayEnd: null,
        expectationText:
          "Day 8+: slow plant breakdown. Should smell earthy-sour. White film can be normal; flag fuzzy mold or slime.",
        actionLabel: "Check weekly",
      },
    ],
  },
  {
    id: "tpl-food",
    type: "food",
    category: "food",
    name: "Food ferment",
    defaultUnit: "kg",
    stages: [
      {
        id: "stage-food-0",
        stageIndex: 0,
        name: "Ferment",
        dayStart: 0,
        dayEnd: null,
        expectationText:
          "Day 0+: keep ingredients fully submerged under brine and out of direct sun. Log smell, surface, and pH each check-in — souring (falling pH) is the sign it's working. Use your own recipe's safety guidance to decide when it's ready.",
        actionLabel: "Check in",
      },
    ],
  },
  {
    id: "tpl-custom",
    type: "custom",
    category: "fertilizer",
    name: "Custom ferment",
    defaultUnit: "kg",
    stages: [
      {
        id: "stage-custom-0",
        stageIndex: 0,
        name: "Start",
        dayStart: 0,
        dayEnd: null,
        expectationText:
          "Day 0+: log observations as your process unfolds. Note smell, bubbles, and surface each check-in.",
        actionLabel: null,
      },
    ],
  },
];

export function getSeedTemplate(type: FermentType): SeedTemplate | undefined {
  return SEED_TEMPLATES.find((template) => template.type === type);
}
