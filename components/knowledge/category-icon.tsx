import {
  Apple,
  BookOpen,
  Bug,
  Carrot,
  CupSoda,
  FlaskConical,
  Leaf,
  Mountain,
  Package,
  Bean,
  Fish,
  Sparkles,
  SprayCan,
  Gem,
  Milk,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { KbCategory } from "@/lib/knowledge/types";

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

export function CategoryIcon({ category, className }: { category: KbCategory; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? Mountain;
  return <Icon className={className} aria-hidden />;
}
