"use client";

import { MeasurementSystemProvider } from "@/components/providers/measurement-system-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionGuard } from "@/components/providers/session-guard";
import { SyncProvider } from "@/components/providers/sync-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <QueryProvider>
        <ThemeProvider>
          <MeasurementSystemProvider>
            <SyncProvider>{children}</SyncProvider>
          </MeasurementSystemProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionGuard>
  );
}
