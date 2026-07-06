import {
  Apple,
  Beaker,
  Bean,
  Bone,
  BookOpen,
  Bug,
  Carrot,
  Container,
  CupSoda,
  Droplet,
  Droplets,
  Egg,
  Flame,
  FlaskConical,
  GlassWater,
  Grape,
  Layers,
  Leaf,
  LeafyGreen,
  Milk,
  Mountain,
  Package,
  Fish,
  Salad,
  Sparkles,
  SprayCan,
  Sprout,
  TestTube,
  Trees,
  Gem,
  Waves,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { KbCategory } from "@/lib/knowledge/types";

// Fallback glyph per category. Used when a doc has no specific icon below.
const CATEGORY_ICONS: Record<KbCategory, LucideIcon> = {
  "microbial-culture": Milk,
  "plant-ferment": Leaf,
  "fruit-ferment": Apple,
  "mineral-extract": Gem,
  "amino-acid": Fish,
  "liquid-fertilizer": FlaskConical,
  "solid-fertilizer": Package,
  "pest-control": Bug,
  biostimulant: Sparkles,
  concept: BookOpen,
  application: SprayCan,
  "vegetable-ferment": Carrot,
  "dairy-ferment": Milk,
  "legume-ferment": Bean,
  "grain-ferment": Wheat,
  "cultured-beverage": CupSoda,
};

// Distinct, same-family glyph per recipe, so cultures/minerals/amino-acids that
// share a category don't all render the same icon. Keyed by doc id.
const RECIPE_ICONS: Record<string, LucideIcon> = {
  // Plant / fruit ferments
  fpj: Sprout, // growing tips
  ffj: Grape,
  // Amino acids (previously both a fish)
  faa: Fish,
  hydrolysate: Droplets,
  // Microbial cultures
  lab: Milk,
  "lab-serum": TestTube,
  brv: Droplet, // vinegar
  imo: Trees, // gathered from the forest floor
  "mountain-microorganisms": Mountain,
  "spice-compost": Package,
  yeast: Wheat,
  // Mineral extracts
  "mineral-bioles": Gem,
  seawater: Waves,
  wca: Egg, // eggshell calcium
  wcp: Bone, // bone calcium phosphate
  "ws-k": Flame, // plant-ash potassium
  "ws-pa": Beaker,
  loess: Layers, // sediment
  // Liquid fertilizers
  biofertilizer: FlaskConical,
  biole: Container,
  // Biostimulants
  ohn: Sprout,
  "bio-stimulant-nettle": Leaf,
  // Cultured beverages
  kombucha: CupSoda,
  "water-kefir": GlassWater,
  "milk-kefir": Milk,
  // Vegetable ferments
  kimchi: Salad,
  sauerkraut: LeafyGreen,
};

export function CategoryIcon({
  category,
  id,
  className,
}: {
  category: KbCategory;
  /** Doc id, to prefer a recipe-specific glyph over the category fallback. */
  id?: string;
  className?: string;
}) {
  const Icon = (id && RECIPE_ICONS[id]) || CATEGORY_ICONS[category] || Mountain;
  return <Icon className={className} aria-hidden />;
}
