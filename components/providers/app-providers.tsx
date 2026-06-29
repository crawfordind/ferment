"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { SyncProvider } from "@/components/providers/sync-provider";
import { TemperatureUnitProvider } from "@/components/providers/temperature-unit-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TemperatureUnitProvider>
        <SyncProvider>{children}</SyncProvider>
      </TemperatureUnitProvider>
    </QueryProvider>
  );
}
