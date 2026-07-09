"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

// The Learn section is a hub over two libraries of reading content: the recipe-led
// Knowledge Base and the editorial Blog. This segmented switch is shared by both
// list pages so the hand-off between them reads as one place. The bottom-nav "Learn"
// tab stays lit across both routes (see components/layout/bottom-nav.tsx).
const TABS = [
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/blog", label: "Blog", icon: Newspaper },
] as const;

export function LearnTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Learn sections"
      className="grid grid-cols-2 gap-1 rounded-[var(--radius-button)] border-2 border-hairline bg-card p-1"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => haptic()}
            className={cn(
              "flex min-h-[38px] items-center justify-center gap-1.5 rounded-[calc(var(--radius-button)-4px)] px-3 text-sm font-semibold transition-colors",
              active
                ? "bg-subtle-fill text-ink shadow-[var(--shadow-sm)]"
                : "text-secondary hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
