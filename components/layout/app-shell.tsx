import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div
        className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]"
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
