"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [locking, setLocking] = useState(false);

  async function handleLock() {
    setLocking(true);
    try {
      await fetch("/api/unlock", { method: "DELETE" });
    } catch {
      // Even if the request fails, sending the user to the gate is safe.
    }
    window.location.assign("/unlock");
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <h1 className="text-xl font-bold text-ink">Settings</h1>
      <p className="mt-2 text-secondary">
        Preferences and data export will live here.
      </p>

      <div className="mt-8 border-t border-hairline pt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={handleLock}
          disabled={locking}
        >
          {locking ? "Locking…" : "Lock app"}
        </Button>
        <p className="mt-2 text-xs text-muted">
          Signs out of this device and returns to the passcode screen.
        </p>
      </div>
    </main>
  );
}
