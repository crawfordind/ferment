"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { askAssistantApi } from "@/lib/api/client";
import { useCreateObservation } from "@/hooks/use-observations";
import type { ChatMessage, Proposal } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";

// Kombucha Buddy — the batch-aware chat surface. Read-only Q&A grounded in the
// user's own batches plus the bundled knowledge/troubleshooting content, with
// confirm-gated write proposals: the server never mutates, so the user taps
// Confirm to actually log a check-in (via the existing offline-first path) or to
// open the New Batch flow.

type BuddyPanelProps = {
  /** The batch being viewed, so "this batch" resolves and log confirms can write. */
  batchId?: string;
};

const SUGGESTIONS = [
  "Is a white film on top normal?",
  "How is this batch doing?",
  "When should I bottle?",
];

export function BuddyPanel({ batchId }: BuddyPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createObservation = useCreateObservation(batchId ?? "");

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setProposals([]);
    setError(null);
    setPending(true);

    try {
      const reply = await askAssistantApi({ messages: next, batchId });
      setMessages([...next, { role: "assistant", content: reply.message }]);
      setProposals(reply.proposals);
    } catch {
      setError("The buddy is unavailable right now. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  function dismissProposal(index: number) {
    setProposals((prev) => prev.filter((_, i) => i !== index));
  }

  async function confirmLog(
    proposal: Extract<Proposal, { kind: "log_observation" }>,
    index: number,
  ) {
    // Only the currently-viewed batch can be logged from here (the offline write
    // path is keyed to it). A proposal for another batch links out instead.
    if (proposal.batchId !== batchId) return;
    await createObservation.mutateAsync({
      note: proposal.note,
      chipKeys: proposal.chipKeys,
      ph: proposal.ph,
      brix: proposal.brix,
      tempC: proposal.tempC,
    });
    dismissProposal(index);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-tap-min w-full items-center gap-2 rounded-[var(--radius-card)] border border-border bg-card px-4 text-left text-sm font-semibold text-ink hover:bg-subtle-fill"
      >
        <Sparkles className="size-4 text-accent" />
        Ask Kombucha Buddy
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles className="size-4 text-accent" />
          Kombucha Buddy
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close buddy"
          onClick={() => setOpen(false)}
        >
          <X className="size-5" />
        </Button>
      </header>

      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-secondary">
            Ask about this batch, whether a sign is normal, or what needs
            attention. I can also suggest a check-in for you to confirm.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-[var(--radius-chip)] px-3 py-2 text-sm",
                m.role === "user"
                  ? "self-end bg-accent text-white"
                  : "self-start bg-subtle-fill text-ink",
              )}
            >
              {m.content}
            </div>
          ))
        )}
        {pending ? (
          <p className="self-start text-sm text-muted">Thinking…</p>
        ) : null}
      </div>

      {proposals.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
            Suggested — you confirm
          </p>
          {proposals.map((proposal, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-chip)] border border-border bg-surface px-3 py-2"
            >
              <span className="text-sm text-ink">{proposal.summary}</span>
              {proposal.kind === "log_observation" ? (
                proposal.batchId === batchId ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      aria-label="Confirm check-in"
                      disabled={createObservation.isPending}
                      onClick={() => confirmLog(proposal, index)}
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Dismiss"
                      onClick={() => dismissProposal(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    size="default"
                    className="shrink-0"
                  >
                    <Link href={`/batch/${proposal.batchId}/log`}>Open</Link>
                  </Button>
                )
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="shrink-0"
                >
                  <Link href="/new">Start</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-[var(--radius-chip)] border border-border px-3 py-1 text-xs text-secondary hover:bg-subtle-fill"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-warning">{error}</p> : null}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the buddy…"
          aria-label="Ask Kombucha Buddy"
          className="min-h-tap-min flex-1 rounded-[var(--radius-chip)] border border-border bg-surface px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={pending || !input.trim()}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  );
}
