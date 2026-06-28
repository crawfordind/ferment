import { cn } from "@/lib/utils";

/**
 * Diagonal-hatch stand-in for a not-yet-captured photo (matches the
 * wireframe convention). Real photos arrive in Phase 4.
 */
export function PhotoPlaceholder({
  className,
  grayscale = false,
}: {
  className?: string;
  grayscale?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center border border-hairline bg-subtle-fill text-muted",
        grayscale && "grayscale",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(154,148,134,0.18) 6px, rgba(154,148,134,0.18) 7px)",
      }}
    />
  );
}
