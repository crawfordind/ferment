// Rotating fermentation tips for the dashboard's Featured widget. These are
// short, practical, and grounded in the same sources as the Knowledge Base —
// each optionally deep-links to the recipe or concept that explains it.

/** Shelf a tip is most relevant to, matching a batch's `category`. */
export type TipSection = "fertilizer" | "food" | "beverage";

export type FermentTip = {
  id: string;
  /** Short kicker shown above the tip (e.g. "Safety", "Technique"). */
  tag: string;
  title: string;
  body: string;
  /** Optional Knowledge Base doc id to "Learn more" about this tip. */
  learnMore?: string;
  /**
   * Shelves this tip is specific to. Omitted → a general tip that applies to
   * any ferment. Used to personalise the order to what the user is making.
   */
  appliesTo?: TipSection[];
};

export const FERMENT_TIPS: FermentTip[] = [
  {
    id: "brine-2-percent",
    tag: "Technique",
    title: "Weigh your salt, don't guess it",
    body: "For lacto-fermented vegetables, salt at about 2% of the vegetable's weight. It favours the lactic-acid bacteria you want while holding back spoilage microbes — a pinch by eye is the usual reason a kraut goes soft.",
    learnMore: "sauerkraut",
    appliesTo: ["food"],
  },
  {
    id: "submerge",
    tag: "Safety",
    title: "Submerged is safe",
    body: "Keep vegetables under the brine and air out. Lacto-fermentation is anaerobic; what floats above the liquid is where mould and kahm yeast take hold. Weigh the ferment down and press it back under after each taste.",
    learnMore: "kimchi",
    appliesTo: ["food"],
  },
  {
    id: "ph-46",
    tag: "Safety",
    title: "pH 4.6 is the safety line",
    body: "Fermented foods keep because they get acidic, not because they're cooked. A healthy vegetable ferment drops below pH 4.6 within days — that acidity is what shuts out pathogens. Cloudy brine and a clean sour smell are good signs.",
    learnMore: "sauerkraut",
    appliesTo: ["food"],
  },
  {
    id: "dont-wash-fpj",
    tag: "KNF",
    title: "Don't wash your FPJ greens",
    body: "The wild yeast and lactic bacteria that drive Fermented Plant Juice live on the leaf surface. Collect growing tips at dawn and shake off dirt only — washing rinses the culture away before it can start.",
    learnMore: "fpj",
    appliesTo: ["fertilizer"],
  },
  {
    id: "starter-acidity",
    tag: "Safety",
    title: "Start kombucha acidic",
    body: "Always pitch at least 10% mature, sour starter tea with your SCOBY. Beginning below about pH 4.2 means the culture out-competes anything harmful before it can get a foothold — the single most important safety step for a home brew.",
    learnMore: "kombucha",
    appliesTo: ["beverage"],
  },
  {
    id: "temperature-lever",
    tag: "Technique",
    title: "Temperature is your main dial",
    body: "Warm ferments go fast and sharp; cool ferments go slow and complex. Kimchi fermented cold stays fizzy and mellow for weeks, while a warm jar can turn sour in days. Adjust time to temperature, not the calendar.",
    learnMore: "kimchi",
  },
  {
    id: "yogurt-heat",
    tag: "Technique",
    title: "Heat milk before you culture it",
    body: "Taking milk to ~82°C before cooling and inoculating denatures the whey proteins so they set into a thicker, less weepy yogurt. Then hold it steady at 42–45°C — the two yogurt bacteria only thrive at blood heat.",
    learnMore: "yogurt",
    appliesTo: ["food"],
  },
  {
    id: "feed-your-grains",
    tag: "Care",
    title: "Living cultures need feeding",
    body: "Kefir grains, a sourdough starter and a SCOBY are living communities — they starve if left too long without fresh food. Keep them fed on a rhythm, or slow them down in the fridge between batches rather than abandoning them.",
    learnMore: "milk-kefir",
    appliesTo: ["beverage", "food"],
  },
  {
    id: "no-reactive-metal",
    tag: "Safety",
    title: "Keep acids off reactive metal",
    body: "The organic acids in kombucha, water kefir and vinegar corrode aluminium and untreated metal, leaching it into your drink. Ferment and strain with glass, food-grade plastic or nylon instead.",
    learnMore: "water-kefir",
    appliesTo: ["beverage"],
  },
  {
    id: "trust-your-nose",
    tag: "Troubleshooting",
    title: "Trust your nose over the clock",
    body: "A good ferment smells pleasantly sour, tangy or yeasty. Putrid, rotten or solvent smells — or fuzzy coloured mould — mean it's time to discard. A flat white film (kahm yeast) is harmless; skim it and carry on.",
    learnMore: "sauerkraut",
  },
];

/**
 * Reorder tips so the ones relevant to what the user is fermenting come first:
 * shelf-specific matches, then general tips, then the rest. When the user has no
 * active ferments (empty `sections`) the original curated order is preserved.
 */
export function personalizeTips(
  tips: FermentTip[],
  sections: Iterable<string>,
): { tips: FermentTip[]; matchedIds: Set<string> } {
  const active = new Set(sections);
  if (active.size === 0) {
    return { tips, matchedIds: new Set() };
  }

  const isMatch = (t: FermentTip) => Boolean(t.appliesTo?.some((s) => active.has(s)));
  const isGeneral = (t: FermentTip) => !t.appliesTo || t.appliesTo.length === 0;

  const matched = tips.filter(isMatch);
  const general = tips.filter((t) => !isMatch(t) && isGeneral(t));
  const rest = tips.filter((t) => !isMatch(t) && !isGeneral(t));

  return {
    tips: [...matched, ...general, ...rest],
    matchedIds: new Set(matched.map((t) => t.id)),
  };
}
