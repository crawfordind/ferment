/** A single recipe ingredient on a batch. Stored JSON-encoded in `batches.inputs`. */
export type BatchInput = {
  name: string;
  quantity: number | null;
  unit: string;
};

/** Parse the JSON `inputs` column into a typed array, tolerating bad/empty data. */
export function parseInputs(json: string | null | undefined): BatchInput[] {
  if (!json) {
    return [];
  }
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        quantity:
          typeof item.quantity === "number" && Number.isFinite(item.quantity)
            ? item.quantity
            : null,
        unit: typeof item.unit === "string" ? item.unit : "",
      }))
      .filter((item) => item.name.trim() !== "");
  } catch {
    return [];
  }
}

/** Serialize inputs back to a JSON string, or null when there is nothing to keep. */
export function serializeInputs(inputs: BatchInput[]): string | null {
  const cleaned = inputs.filter((item) => item.name.trim() !== "");
  return cleaned.length === 0 ? null : JSON.stringify(cleaned);
}

// Base units are grams and millilitres; imperial units convert to the same base
// so ratios and salt-% compare cleanly regardless of the unit the user picked.
const MASS_TO_GRAMS: Record<string, number> = {
  kg: 1000,
  g: 1,
  lb: 453.59237,
  oz: 28.349523125,
};
const VOLUME_TO_ML: Record<string, number> = {
  l: 1000,
  ml: 1,
  gal: 3785.411784,
  "fl oz": 29.5735295625,
};

/** Normalize a quantity to a base unit (grams for mass, ml for volume); null if not comparable. */
function toBase(
  quantity: number | null,
  unit: string,
): { value: number; dimension: "mass" | "volume" } | null {
  if (quantity === null || !Number.isFinite(quantity)) {
    return null;
  }
  const key = unit.trim().toLowerCase();
  if (key in MASS_TO_GRAMS) {
    return { value: quantity * MASS_TO_GRAMS[key], dimension: "mass" };
  }
  if (key in VOLUME_TO_ML) {
    return { value: quantity * VOLUME_TO_ML[key], dimension: "volume" };
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Human-readable ratio of the two largest comparable (same-dimension) inputs,
 * e.g. "1 : 1" for equal-weight FPJ. Returns null when fewer than two compare.
 */
export function computeRatio(inputs: BatchInput[]): string | null {
  const comparable = inputs
    .map((item) => toBase(item.quantity, item.unit))
    .filter((value): value is NonNullable<typeof value> => value !== null);

  // Group by dimension; ratios only make sense within one dimension.
  for (const dimension of ["mass", "volume"] as const) {
    const values = comparable
      .filter((value) => value.dimension === dimension)
      .map((value) => value.value)
      .sort((a, b) => b - a);

    if (values.length < 2) {
      continue;
    }

    const [a, b] = values;
    if (a <= 0 || b <= 0) {
      continue;
    }

    // Express as small whole numbers when clean, else one decimal place.
    const ratio = a / b;
    if (Number.isInteger(ratio)) {
      return `${ratio} : 1`;
    }
    const scaledA = Math.round(a);
    const scaledB = Math.round(b);
    const divisor = gcd(scaledA, scaledB) || 1;
    const simpleA = scaledA / divisor;
    const simpleB = scaledB / divisor;
    if (simpleA <= 20 && simpleB <= 20) {
      return `${simpleA} : ${simpleB}`;
    }
    return `${ratio.toFixed(1)} : 1`;
  }

  return null;
}

/**
 * Salt as a percent of total mass — the food-ferment analog of the sugar ratio.
 * Matches any input whose name contains "salt". Returns null without a salt
 * input or comparable masses.
 */
export function computeSaltPercent(inputs: BatchInput[]): number | null {
  let saltGrams = 0;
  let totalGrams = 0;
  let sawSalt = false;

  for (const item of inputs) {
    const base = toBase(item.quantity, item.unit);
    if (!base || base.dimension !== "mass") {
      continue;
    }
    totalGrams += base.value;
    if (item.name.trim().toLowerCase().includes("salt")) {
      saltGrams += base.value;
      sawSalt = true;
    }
  }

  if (!sawSalt || totalGrams <= 0) {
    return null;
  }

  return (saltGrams / totalGrams) * 100;
}
