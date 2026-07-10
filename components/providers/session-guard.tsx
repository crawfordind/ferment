"use client";

import { useEffect, useState } from "react";
import Dexie from "dexie";

import { UID_COOKIE } from "@/lib/auth";

const LAST_UID_KEY = "ferment:last-uid";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/**
 * Guards against one account seeing another's locally-cached data on a shared
 * device. The server already scopes every request by the session user; this
 * clears the offline IndexedDB cache when the signed-in user id changes from the
 * one that last populated it, then reloads so the app rehydrates fresh.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    const currentUid = readCookie(UID_COOKIE);
    if (!currentUid) return; // Not signed in (or on the login screen); nothing to guard.

    const lastUid = window.localStorage.getItem(LAST_UID_KEY);
    if (lastUid === currentUid) return;

    // First sign-in on this device just records the owner — no data to clear.
    if (!lastUid) {
      window.localStorage.setItem(LAST_UID_KEY, currentUid);
      return;
    }

    // Account switch: drop the previous user's cached ferment data and reload.
    setWiping(true);
    void Dexie.delete("ferment-tracker")
      .catch(() => {
        // If deletion fails, still record the new uid so we don't loop.
      })
      .finally(() => {
        window.localStorage.setItem(LAST_UID_KEY, currentUid);
        window.location.reload();
      });
  }, []);

  if (wiping) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 text-sm text-secondary">
        Switching accounts…
      </main>
    );
  }

  return <>{children}</>;
}
