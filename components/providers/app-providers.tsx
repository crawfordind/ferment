"use client";

import { MeasurementSystemProvider } from "@/components/providers/measurement-system-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SyncProvider } from "@/components/providers/sync-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <MeasurementSystemProvider>
        <SyncProvider>{children}</SyncProvider>
      </MeasurementSystemProvider>
    </QueryProvider>
  );
}
