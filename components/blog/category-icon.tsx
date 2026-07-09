import { FlaskConical, Heart, History, Microscope, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

import type { BlogCategory } from "@/lib/blog/types";

// One icon per editorial section, mirroring the Knowledge Base's CategoryIcon so the
// two libraries share a visual language. Every tile is accent-tinted; the glyph, not
// color, distinguishes the section.
const ICONS: Record<BlogCategory, LucideIcon> = {
  science: FlaskConical,
  microbiology: Microscope,
  safety: ShieldCheck,
  health: Heart,
  history: History,
  guide: Sparkles,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: BlogCategory;
  className?: string;
}) {
  const Icon = ICONS[category] ?? FlaskConical;
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}
