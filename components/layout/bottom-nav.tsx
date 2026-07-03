"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Archive, Plus, Settings, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The primary create action — rendered as a filled accent chip. */
  primary?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/archive", label: "Past", icon: Archive },
  { href: "/new", label: "New", icon: Plus, primary: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="group flex min-h-[var(--tap-min)] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-colors",
                    primary
                      ? "bg-accent text-white shadow-[0_2px_6px_rgba(95,122,63,0.35)] group-hover:bg-accent/90"
                      : cn(
                          "text-secondary group-hover:text-ink",
                          isActive && "bg-accent/10 text-accent",
                        ),
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={2} aria-hidden />
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    isActive || primary ? "text-accent" : "text-secondary",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
