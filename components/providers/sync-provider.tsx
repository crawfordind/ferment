"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { flushPendingMedia } from "@/offline/media-sync";
import {
  countPendingOutbox,
  flushOutbox,
  getPendingEntityIds,
} from "@/offline/repository";

type SyncState = {
  pendingCount: number;
  pendingIds: Set<string>;
  online: boolean;
};

const SyncContext = createContext<SyncState>({
  pendingCount: 0,
  pendingIds: new Set(),
  online: true,
});

export function useSync(): SyncState {
  return useContext(SyncContext);
}

/** True if a given entity (batch/observation/photo) has un-synced changes. */
export function useIsPending(id: string | null | undefined): boolean {
  const { pendingIds } = useSync();
  return id ? pendingIds.has(id) : false;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SyncState>({
    pendingCount: 0,
    pendingIds: new Set(),
    online: true,
  });

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const [pendingCount, pendingIds] = await Promise.all([
          countPendingOutbox(),
          getPendingEntityIds(),
        ]);
        if (mounted) {
          setState({
            pendingCount,
            pendingIds,
            online:
              typeof navigator === "undefined" ? true : navigator.onLine,
          });
        }
      } catch {
        if (mounted) {
          setState((prev) => ({ ...prev, pendingCount: 0, pendingIds: new Set() }));
        }
      }
    }

    // Flush only on mount and on reconnect — never on a tight interval, which
    // would re-hammer the network retrying any item that keeps failing.
    async function sync() {
      try {
        await flushOutbox();
        const media = await flushPendingMedia();
        if (media.changed) {
          await queryClient.invalidateQueries();
        }
      } catch {
        // Network/transient; the next reconnect retries.
      }
      await refresh();
    }

    void sync();

    const handleOnline = () => {
      setState((prev) => ({ ...prev, online: true }));
      void sync();
    };
    const handleOffline = () =>
      setState((prev) => ({ ...prev, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // The interval only refreshes the (cheap) pending indicator, no flushing.
    const interval = window.setInterval(() => {
      void refresh();
    }, 5_000);

    return () => {
      mounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(interval);
    };
  }, [queryClient]);

  return (
    <SyncContext.Provider value={state}>
      {state.pendingCount > 0 ? (
        <div
          className="border-b border-accent/20 bg-accent/10 px-4 py-2 text-center text-sm text-accent"
          role="status"
        >
          {state.online ? "Syncing" : "Saved offline"} — {state.pendingCount}{" "}
          item{state.pendingCount === 1 ? "" : "s"}{" "}
          {state.online ? "in progress" : "will sync"}
        </div>
      ) : null}
      {children}
    </SyncContext.Provider>
  );
}
