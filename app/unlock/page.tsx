"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

function sanitizeFrom(from: string | null): string {
  // Only allow same-origin app paths to avoid open-redirect via ?from=.
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return "/";
}

function UnlockForm() {
  const searchParams = useSearchParams();
  const target = sanitizeFrom(searchParams.get("from"));

  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!passcode.trim()) return;
    setStatus("submitting");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        setStatus("error");
        setPasscode("");
        return;
      }

      // Hard navigation so the new session cookie is applied on the next request.
      window.location.assign(target);
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-2xl">
            🫙
          </div>
          <h1 className="text-2xl font-bold text-ink">Ferment Tracker</h1>
          <p className="text-sm text-secondary">
            Enter the passcode to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="passcode" className="text-sm font-medium text-ink">
              Passcode
            </label>
            <input
              id="passcode"
              type="password"
              autoComplete="current-password"
              inputMode="text"
              autoFocus
              value={passcode}
              onChange={(event) => {
                setPasscode(event.target.value);
                if (status === "error") setStatus("idle");
              }}
              aria-invalid={status === "error"}
              className="min-h-tap-primary rounded-[var(--radius-card)] border-2 border-border bg-white px-4 py-2 text-ink focus:border-accent focus:outline-none"
            />
          </div>

          {status === "error" ? (
            <p className="text-sm text-status-needs-action-text" role="alert">
              Incorrect passcode. Try again.
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={status === "submitting" || !passcode.trim()}
          >
            {status === "submitting" ? "Unlocking…" : "Unlock"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={null}>
      <UnlockForm />
    </Suspense>
  );
}
