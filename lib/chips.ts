import type { FermentType } from "@/lib/schema";

export type ChipGroup = "smell" | "activity" | "surface";
export type ChipSeverity = "neutral" | "warning";

export type ChipDefinition = {
  key: string;
  group: ChipGroup;
  label: string;
  severity: ChipSeverity;
};

export const CHIPS: ChipDefinition[] = [
  { key: "smell_sweet", group: "smell", label: "Sweet", severity: "neutral" },
  { key: "smell_sour", group: "smell", label: "Sour", severity: "neutral" },
  { key: "smell_boozy", group: "smell", label: "Boozy", severity: "neutral" },
  { key: "smell_yeasty", group: "smell", label: "Yeasty", severity: "neutral" },
  { key: "smell_earthy", group: "smell", label: "Earthy", severity: "neutral" },
  { key: "smell_ammonia", group: "smell", label: "Ammonia", severity: "warning" },
  { key: "smell_rotten", group: "smell", label: "Rotten", severity: "warning" },
  {
    key: "activity_bubbling_lots",
    group: "activity",
    label: "Bubbling lots",
    severity: "neutral",
  },
  {
    key: "activity_some_bubbles",
    group: "activity",
    label: "Some bubbles",
    severity: "neutral",
  },
  { key: "activity_calm", group: "activity", label: "Calm", severity: "neutral" },
  { key: "surface_clean", group: "surface", label: "Clean", severity: "neutral" },
  {
    key: "surface_white_film",
    group: "surface",
    label: "White film",
    severity: "neutral",
  },
  {
    key: "surface_fuzzy_mold",
    group: "surface",
    label: "Fuzzy mold",
    severity: "warning",
  },
  { key: "surface_slime", group: "surface", label: "Slime", severity: "warning" },
];

const CHIP_MAP = new Map(CHIPS.map((chip) => [chip.key, chip]));

/** Primary chips surfaced first per ferment type; remainder available via "More". */
export const CHIPS_BY_TYPE: Record<FermentType, string[]> = {
  fpj: [
    "smell_sweet",
    "smell_sour",
    "smell_ammonia",
    "smell_rotten",
    "activity_bubbling_lots",
    "activity_calm",
    "surface_white_film",
    "surface_fuzzy_mold",
  ],
  ffj: [
    "smell_sweet",
    "smell_sour",
    "smell_boozy",
    "smell_rotten",
    "activity_bubbling_lots",
    "activity_some_bubbles",
    "surface_clean",
    "surface_slime",
  ],
  labs: [
    "smell_sour",
    "smell_yeasty",
    "smell_ammonia",
    "activity_bubbling_lots",
    "activity_calm",
    "surface_white_film",
    "surface_fuzzy_mold",
  ],
  fish: [
    "smell_sour",
    "smell_ammonia",
    "smell_rotten",
    "activity_bubbling_lots",
    "activity_calm",
    "surface_slime",
    "surface_fuzzy_mold",
  ],
  plant: [
    "smell_earthy",
    "smell_sour",
    "smell_ammonia",
    "smell_rotten",
    "activity_calm",
    "surface_clean",
    "surface_slime",
  ],
  custom: [
    "smell_sweet",
    "smell_sour",
    "activity_bubbling_lots",
    "activity_calm",
    "surface_clean",
    "surface_fuzzy_mold",
  ],
};

export function getChip(key: string): ChipDefinition | undefined {
  return CHIP_MAP.get(key);
}

export function getChipsForType(type: FermentType): {
  primary: ChipDefinition[];
  more: ChipDefinition[];
} {
  const primaryKeys = new Set(CHIPS_BY_TYPE[type]);
  const primary = CHIPS_BY_TYPE[type]
    .map((key) => getChip(key))
    .filter((chip): chip is ChipDefinition => chip !== undefined);
  const more = CHIPS.filter((chip) => !primaryKeys.has(chip.key));

  return { primary, more };
}

export function getChipsByGroup(
  chips: ChipDefinition[],
): Record<ChipGroup, ChipDefinition[]> {
  return {
    smell: chips.filter((chip) => chip.group === "smell"),
    activity: chips.filter((chip) => chip.group === "activity"),
    surface: chips.filter((chip) => chip.group === "surface"),
  };
}
