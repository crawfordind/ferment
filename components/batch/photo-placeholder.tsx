import { Container } from "lucide-react";

import { fermentTint } from "@/lib/ferment-visuals";
import { cn } from "@/lib/utils";

/**
 * Stand-in for a not-yet-captured photo. With a `label` (batch initials) it
 * renders a monogram on a ferment-type-tinted tile so each batch stays
 * recognizable; otherwise it shows a neutral jar glyph. Never a broken-image
 * hatch.
 */
export function PhotoPlaceholder({
  className,
  grayscale = false,
  label,
  type,
}: {
  className?: string;
  grayscale?: boolean;
  label?: string;
  type?: string | null;
}) {
  if (label) {
    const tint = fermentTint(type);
    return (
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center text-sm font-bold leading-none",
          grayscale && "grayscale",
          className,
        )}
        style={{ background: tint.background, color: tint.color }}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-subtle-fill text-muted",
        grayscale && "grayscale",
        className,
      )}
    >
      <Container className="size-1/2" strokeWidth={1.75} />
    </div>
  );
}
