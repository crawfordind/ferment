"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { SyncProvider } from "@/components/providers/sync-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SyncProvider>{children}</SyncProvider>
    </QueryProvider>
  );
}
