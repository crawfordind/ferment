import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type WidgetAction = { href: string; label: string };

/**
 * The dashboard's building block: a titled section module.
 *
 * `tone` sets its place in the home hierarchy: "card" is a bordered surface for
 * primary content; "ambient" is a lighter, borderless group for demoted content
 * (tips, learn, shop) — separated from its neighbours by whitespace, not a box.
 */
export function Widget({
  title,
  icon: Icon,
  action,
  children,
  className,
  tone = "card",
}: {
  title: string;
  icon?: LucideIcon;
  action?: WidgetAction;
  children: React.ReactNode;
  className?: string;
  tone?: "card" | "ambient";
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        tone === "card"
          ? "rounded-[var(--radius-card)] border-2 border-hairline bg-card p-4 shadow-[var(--shadow-sm)]"
          : "px-1 pt-1",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          className={cn(
            "flex items-center gap-2",
            tone === "card"
              ? "text-sm font-bold text-ink"
              : "text-[13px] font-semibold text-secondary",
          )}
        >
          {Icon ? (
            <Icon
              className={cn(
                "size-[18px]",
                tone === "card" ? "text-accent" : "text-muted",
              )}
              aria-hidden
            />
          ) : null}
          {title}
        </h2>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-[var(--radius-chip)] px-1 text-xs font-semibold text-accent transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {action.label}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
