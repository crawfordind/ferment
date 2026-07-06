import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type WidgetAction = { href: string; label: string };

/**
 * The dashboard's building block: a titled card module. Every home-screen
 * section is a Widget, so the dashboard stays a consistent, extensible grid of
 * cards as we add more (products, insights, reminders, …).
 */
export function Widget({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: WidgetAction;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-hairline bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          {Icon ? <Icon className="size-[18px] text-accent" aria-hidden /> : null}
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

/** A compact metric cell for stat rows inside a Widget. */
export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "attention";
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-0.5 rounded-[var(--radius-card)] px-3 py-2.5",
        tone === "attention"
          ? "bg-[color-mix(in_srgb,var(--status-needs-action)_14%,white)]"
          : "bg-subtle-fill",
      )}
    >
      <span
        className={cn(
          "text-2xl font-bold leading-none tabular-nums",
          tone === "accent" && "text-accent",
          tone === "attention" ? "text-[var(--status-needs-action-text)]" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
