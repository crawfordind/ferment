/**
 * Sensory taxonomies, modelled on the Kombucha Brewers International (KBI)
 * sensory posters:
 *   - the Kombucha Flavor Flower (positive tasting vocabulary)
 *   - the Off-Flavors / Aromas wheel (faults)
 *   - the Mouthfeel wheel (texture / structure, rated on intensity scales)
 *
 * These are transcribed from the printed wheels and centralised here so the
 * descriptor lists are the single source of truth — edit a label or add a note
 * in one place and every surface (the interactive wheel, the timeline tags,
 * troubleshooting) picks it up. Descriptor order follows the poster, clockwise.
 *
 * The data is intentionally UI-free: colours are expressed as an HSL hue/sat so
 * a renderer can derive a per-descriptor gradient (like the poster's petals)
 * and stay legible in both light and dark themes.
 */

/** A colour family — the coloured wedge in the wheel's inner ring. */
export type WheelFamily = {
  key: string;
  label: string;
  /** Base hue (0–360) and saturation (%) used to shade the family's petals. */
  hue: number;
  sat: number;
  descriptors: string[];
};

export type DescriptorWheel = {
  id: "flavor" | "off";
  title: string;
  /** Centre-hub label. */
  hub: string;
  blurb: string;
  families: WheelFamily[];
};

/**
 * The Kombucha Flavor Flower — the positive vocabulary a taster reaches for.
 * Fruity's poster sub-bands (Apple, Stone Fruit, Tropical, Citrus, Melon) are
 * flattened into the family in poster order to keep the model two levels deep.
 */
export const FLAVOR_WHEEL: DescriptorWheel = {
  id: "flavor",
  title: "Flavor Flower",
  hub: "Kombucha Flavor Flower",
  blurb:
    "The positive aroma and taste vocabulary — tap a family, then the notes you pick up.",
  families: [
    {
      key: "berry",
      label: "Berry",
      hue: 344,
      sat: 52,
      descriptors: [
        "Aronia Berry",
        "Blackberry",
        "Blueberry",
        "Concord Grape",
        "Cranberry",
        "Elderberry",
        "Goji Berry",
        "Gooseberry",
        "Green Grape",
        "Huckleberry",
        "Marionberry",
        "Pomegranate",
        "Raspberry",
        "Strawberry",
      ],
    },
    {
      key: "fruity",
      label: "Fruity",
      hue: 4,
      sat: 68,
      descriptors: [
        "Green Apple",
        "Red Apple",
        "Pear",
        "Plum",
        "Peach",
        "Cherry",
        "Pineapple",
        "Passion Fruit",
        "Mango",
        "Kiwi",
        "Guava",
        "Coconut",
        "Dragonfruit / Pitaya",
        "Banana / Plantain",
        "Honeydew",
        "Prickly Pear",
        "Watermelon",
        "Blood Orange",
        "Citra Hops",
        "Grapefruit",
        "Lemon",
        "Lime",
        "Orange",
        "Tangerine",
        "Vinegar",
      ],
    },
    {
      key: "floral",
      label: "Floral",
      hue: 20,
      sat: 82,
      descriptors: [
        "Butterfly Pea Tea",
        "Chamomile",
        "Elderflower",
        "Hibiscus",
        "Jasmine",
        "Lavender",
        "Lemon Verbena",
        "Rose",
        "Saffron",
      ],
    },
    {
      key: "herbaceous",
      label: "Herbaceous",
      hue: 40,
      sat: 80,
      descriptors: [
        "Basil",
        "Bee Balm / Oswego",
        "Dill",
        "Echinacea",
        "Oregano",
        "Peppermint",
        "Rosemary",
        "Spearmint",
        "Thyme",
      ],
    },
    {
      key: "grassy",
      label: "Grassy",
      hue: 68,
      sat: 52,
      descriptors: [
        "Blue Spirulina",
        "Dandelion",
        "Green Tea",
        "Lemongrass",
        "Matcha",
        "Wheatgrass",
        "Yerba Mate / Guayusa / Yaupon",
      ],
    },
    {
      key: "vegetal",
      label: "Vegetal",
      hue: 108,
      sat: 42,
      descriptors: [
        "Carrot",
        "Citrus Peel",
        "Garlic",
        "Green Bell Pepper",
        "Green Onion",
        "Habanero",
        "Horseradish",
        "Jalapeño",
        "Kale",
        "Melon Rind",
        "Onion",
        "Seaweed",
      ],
    },
    {
      key: "earthy",
      label: "Earthy",
      hue: 96,
      sat: 30,
      descriptors: [
        "Soil",
        "Mushroom (Reishi / Chaga)",
        "Hops",
        "Cumin",
        "Coffee",
        "Cacao",
        "Turmeric",
      ],
    },
    {
      key: "woody",
      label: "Woody",
      hue: 28,
      sat: 44,
      descriptors: [
        "Oak",
        "Pine",
        "Spruce",
        "Cedar",
        "Sassafras",
        "Sarsaparilla",
        "Maple",
        "Chicory",
        "Black Tea",
        "Chinook / Columbus / Simcoe Hops",
      ],
    },
    {
      key: "spicy",
      label: "Spicy",
      hue: 8,
      sat: 56,
      descriptors: [
        "Black Pepper",
        "Cayenne",
        "Cinnamon",
        "Clove",
        "Ginger",
        "Juniper",
        "Licorice / Anise",
        "Peppercorns",
        "Allspice",
      ],
    },
    {
      key: "sweet_aromatic",
      label: "Sweet Aromatic",
      hue: 330,
      sat: 44,
      descriptors: ["Agave", "Bubblegum", "Honey", "Maple Syrup", "Vanilla"],
    },
  ],
};

/** The Off-Flavors / Aromas wheel — faults, grouped by their character. */
export const OFF_FLAVOR_WHEEL: DescriptorWheel = {
  id: "off",
  title: "Off-Flavors",
  hub: "Off Flavors / Aromas",
  blurb:
    "Faults and defects — flag what's wrong so troubleshooting can point at a cause.",
  families: [
    {
      key: "dairy",
      label: "Dairy",
      hue: 214,
      sat: 44,
      descriptors: [
        "Sour Cream",
        "Cheese",
        "Butterscotch",
        "Butter",
        "Sour Milk",
      ],
    },
    {
      key: "solvent",
      label: "Solvent",
      hue: 182,
      sat: 42,
      descriptors: [
        "Medicinal",
        "Metallic",
        "Nail Polish Remover (Acetone)",
        "Oxidized",
      ],
    },
    {
      key: "stale",
      label: "Stale",
      hue: 204,
      sat: 50,
      descriptors: ["Cardboard", "Meaty / Soy Sauce", "Mousy", "Rust", "Sweat"],
    },
    {
      key: "rotten",
      label: "Rotten",
      hue: 222,
      sat: 54,
      descriptors: [
        "Barnyard",
        "Musty",
        "Rotten Cheese",
        "Rotten Egg (Sulfur)",
        "Skunky",
        "Spoiled Milk",
      ],
    },
  ],
};

export const DESCRIPTOR_WHEELS: DescriptorWheel[] = [
  FLAVOR_WHEEL,
  OFF_FLAVOR_WHEEL,
];

/**
 * Mouthfeel is not a descriptor pick-list — each attribute is rated on an
 * ordered intensity scale (the poster's None → Low → Medium → High petals), so
 * it gets its own shape and a segmented-scale UI rather than the wheel.
 */
export type MouthfeelAttribute = {
  key: string;
  label: string;
  /** Ordered from least to most intense; index carries the rating. */
  scale: string[];
};

export type MouthfeelGroup = {
  key: string;
  label: string;
  hue: number;
  sat: number;
  attributes: MouthfeelAttribute[];
};

export const MOUTHFEEL_GROUPS: MouthfeelGroup[] = [
  {
    key: "effervescence",
    label: "Effervescence",
    hue: 318,
    sat: 34,
    attributes: [
      {
        key: "bubble_size",
        label: "Bubble size",
        scale: ["Small", "Medium", "Large"],
      },
      {
        key: "bubble_density",
        label: "Bubble density",
        scale: ["Dispersed", "Mixed", "Dense"],
      },
      {
        key: "linger",
        label: "Linger",
        scale: ["None", "Low", "Medium", "High"],
      },
    ],
  },
  {
    key: "body",
    label: "Body",
    hue: 260,
    sat: 34,
    attributes: [
      {
        key: "density",
        label: "Density (weight)",
        scale: ["Light", "Balanced", "Heavy"],
      },
      {
        key: "viscosity",
        label: "Viscosity (flow)",
        scale: ["Thin", "Medium", "Thick"],
      },
      {
        key: "sweetness",
        label: "Sweetness",
        scale: ["Dry", "Medium Sweet", "Sweet"],
      },
    ],
  },
  {
    key: "irritation",
    label: "Irritation",
    hue: 356,
    sat: 56,
    attributes: [
      {
        key: "spicy",
        label: "Spicy",
        scale: ["None", "Low", "Medium", "High"],
      },
      {
        key: "carbonation",
        label: "Carbonation",
        scale: ["None", "Mild", "Tingling", "Stinging"],
      },
      {
        key: "alcohol",
        label: "Alcohol",
        scale: ["None", "Mild", "Hot", "Burning"],
      },
    ],
  },
  {
    key: "afterfeel",
    label: "Afterfeel",
    hue: 288,
    sat: 40,
    attributes: [
      {
        key: "mouthwatering",
        label: "Mouthwatering",
        scale: ["None", "Low", "Medium", "High"],
      },
      {
        key: "coating",
        label: "Coating",
        scale: ["None", "Slick", "Coating", "Syrupy", "Cloying"],
      },
      {
        key: "drying",
        label: "Astringency (drying)",
        scale: ["None", "Low", "Drying"],
      },
    ],
  },
];

/**
 * A stable id for a selected descriptor, e.g. `flavor:fruity:Mango`. Used as the
 * chip key so a tasting note round-trips through the same observation-chip
 * storage the process-health chips already use.
 */
export function descriptorKey(
  wheelId: DescriptorWheel["id"],
  familyKey: string,
  descriptor: string,
): string {
  return `${wheelId}:${familyKey}:${descriptor}`;
}

export function parseDescriptorKey(
  key: string,
): { wheelId: string; familyKey: string; descriptor: string } | null {
  const parts = key.split(":");
  if (parts.length < 3) return null;
  const [wheelId, familyKey, ...rest] = parts;
  return { wheelId, familyKey, descriptor: rest.join(":") };
}

/** Even angular width per descriptor, matching the poster's equal-width petals. */
export function totalDescriptors(wheel: DescriptorWheel): number {
  return wheel.families.reduce((n, f) => n + f.descriptors.length, 0);
}
