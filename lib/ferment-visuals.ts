// Visual identity helpers for ferments that have no photo yet. A calm, earthy
// tint per ferment type plus readable initials give each batch a recognizable
// tile instead of a "broken image" placeholder.

/** Base colour per ferment type, drawn from the app's earthy token palette. */
const TYPE_BASE: Record<string, string> = {
  fpj: "var(--accent)", // vegetative green
  plant: "var(--accent)",
  ffj: "var(--status-needs-action)", // fruit terracotta
  fish: "#8a6d3b", // amino brown
  labs: "var(--status-watch)", // culture amber
  food: "#6f8a4a", // sage
  custom: "var(--muted)",
};

export function fermentTint(type?: string | null): {
  background: string;
  color: string;
} {
  const base = (type && TYPE_BASE[type]) || "var(--accent)";
  // Mix against theme tokens (not literal white/ink) so the tint and its text
  // adapt to light and dark mode.
  return {
    background: `color-mix(in srgb, ${base} 16%, var(--surface))`,
    color: `color-mix(in srgb, ${base} 72%, var(--ink))`,
  };
}

/** 1–2 letter monogram from a batch name, falling back to its code. */
export function batchInitials(
  name?: string | null,
  code?: string | null,
): string {
  const source = (name ?? "").trim() || (code ?? "").trim();
  if (!source) return "•";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
