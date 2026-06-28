"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navLinkClass =
  "flex min-h-[var(--tap-min)] min-w-[var(--tap-min)] flex-col items-center justify-center gap-0.5 text-xs font-medium text-secondary transition-colors";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-4 pt-2">
        <Link
          href="/"
          className={cn(
            navLinkClass,
            pathname === "/" && "text-accent",
          )}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Home className="size-6" aria-hidden />
          <span>Home</span>
        </Link>

        <Link
          href="/new"
          className="relative -top-3 flex min-h-[var(--tap-primary)] min-w-[var(--tap-primary)] items-center justify-center rounded-full bg-accent text-2xl font-bold text-white shadow-[0_3px_8px_rgba(0,0,0,0.2)] transition-colors hover:bg-accent/90"
          aria-label="New batch"
          aria-current={pathname === "/new" ? "page" : undefined}
        >
          ＋
        </Link>

        <Link
          href="/settings"
          className={cn(
            navLinkClass,
            pathname === "/settings" && "text-accent",
          )}
          aria-current={pathname === "/settings" ? "page" : undefined}
        >
          <Settings className="size-6" aria-hidden />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
}
