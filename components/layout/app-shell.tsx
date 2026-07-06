"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

// Routes that run as a focused, modal-style task: the bottom nav is hidden so
// the user commits to the flow (or uses its own Cancel/Next footer) rather than
// tapping away by accident.
const IMMERSIVE_ROUTES = ["/new"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = IMMERSIVE_ROUTES.includes(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      <div
        className={cn(
          "mx-auto flex w-full max-w-lg flex-1 flex-col",
          immersive
            ? "pb-[env(safe-area-inset-bottom)]"
            : "pb-[calc(5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </div>
      {immersive ? null : <BottomNav />}
    </div>
  );
}
