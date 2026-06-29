/** Per-unit cost of a finished batch, derived from input cost and yield. */
export type CostPerUnit = {
  value: number;
  unit: string;
};

/**
 * Cost per unit of finished output (e.g. cost per litre). Returns null unless
 * both a positive cost and a positive yield are present.
 */
export function costPerUnit(
  costAmount: number | null | undefined,
  yieldValue: number | null | undefined,
  yieldUnit: string | null | undefined,
): CostPerUnit | null {
  if (
    costAmount === null ||
    costAmount === undefined ||
    !Number.isFinite(costAmount) ||
    yieldValue === null ||
    yieldValue === undefined ||
    !Number.isFinite(yieldValue) ||
    yieldValue <= 0
  ) {
    return null;
  }

  return {
    value: costAmount / yieldValue,
    unit: yieldUnit?.trim() || "unit",
  };
}

/** Format a CostPerUnit as e.g. "$1.20 / L" (currency symbol caller-supplied). */
export function formatCostPerUnit(
  cost: CostPerUnit | null,
  currency = "$",
): string | null {
  if (!cost) {
    return null;
  }
  return `${currency}${cost.value.toFixed(2)} / ${cost.unit}`;
}
