import {
  Apple,
  BookOpen,
  Bug,
  FlaskConical,
  Leaf,
  Mountain,
  Package,
  Fish,
  Sparkles,
  SprayCan,
  Gem,
  Milk,
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
};

export function CategoryIcon({ category, className }: { category: KbCategory; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? Mountain;
  return <Icon className={className} aria-hidden />;
}
