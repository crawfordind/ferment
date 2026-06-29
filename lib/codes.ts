import type { FermentType } from "@/lib/schema";

const TYPE_PREFIX: Record<FermentType, string> = {
  fpj: "FPJ",
  ffj: "FFJ",
  labs: "LABS",
  fish: "FISH",
  plant: "PLANT",
  food: "FOOD",
  custom: "CUSTOM",
};

const DEFAULT_NAMES: Record<FermentType, string> = {
  fpj: "Plant FPJ",
  ffj: "Fruit FFJ",
  labs: "LABS serum",
  fish: "Fish ferment",
  plant: "Plant ferment",
  food: "Food ferment",
  custom: "Custom batch",
};

export function getTypePrefix(type: FermentType): string {
  return TYPE_PREFIX[type];
}

export function parseBatchCodeNumber(
  code: string,
  prefix: string,
): number | null {
  const pattern = new RegExp(`^${prefix}-(\\d{2,})$`);
  const match = code.match(pattern);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

export function formatBatchCode(type: FermentType, sequence: number): string {
  const prefix = getTypePrefix(type);
  return `${prefix}-${String(sequence).padStart(2, "0")}`;
}

export function generateNextBatchCode(
  type: FermentType,
  existingCodes: string[],
): string {
  const prefix = getTypePrefix(type);
  const usedNumbers = existingCodes
    .map((code) => parseBatchCodeNumber(code, prefix))
    .filter((value): value is number => value !== null);

  const nextSequence =
    usedNumbers.length === 0 ? 1 : Math.max(...usedNumbers) + 1;

  return formatBatchCode(type, nextSequence);
}

export function suggestBatchName(
  type: FermentType,
  material?: string,
): string {
  if (material?.trim()) {
    const prefix = getTypePrefix(type);
    return `${material.trim()} ${prefix}`;
  }

  return DEFAULT_NAMES[type];
}
