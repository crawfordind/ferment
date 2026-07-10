"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

function sanitizeFrom(from: string | null): string | null {
  // Only allow same-origin app paths so ?from= can't drive an open redirect.
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return null;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That sign-in link was malformed. Request a new one below.",
  expired: "That sign-in link has expired or was already used. Request a new one.",
  forbidden: "That address isn't allowed to sign in. Contact the owner for access.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const from = sanitizeFrom(searchParams.get("from"));
  const linkError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");

    try {
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect: from ?? undefined }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent text-2xl">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-3 text-sm text-secondary">
          If <span className="font-medium text-ink">{email}</span> has access,
          a sign-in link is on its way. It expires in 15 minutes.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium text-accent underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-2xl">
          🫙
        </div>
        <h1 className="text-2xl font-bold text-ink">MyFerment</h1>
        <p className="text-sm text-secondary">
          Enter your email and we&apos;ll send you a sign-in link.
        </p>
      </div>

      {linkError && status === "idle" ? (
        <p
          className="mb-4 rounded-[var(--radius-card)] border border-status-needs-action/30 bg-status-needs-action/10 px-4 py-3 text-sm text-status-needs-action-text"
          role="alert"
        >
          {ERROR_MESSAGES[linkError] ?? "Something went wrong. Try again."}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-invalid={status === "error"}
            className="min-h-tap-primary rounded-[var(--radius-card)] border-2 border-border bg-card px-4 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>

        {status === "error" ? (
          <p className="text-sm text-status-needs-action-text" role="alert">
            Couldn&apos;t send the link. Check your connection and try again.
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={status === "submitting" || !email.trim()}
        >
          {status === "submitting" ? "Sending…" : "Send sign-in link"}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
