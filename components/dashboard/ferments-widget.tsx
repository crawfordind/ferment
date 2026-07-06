"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";

import { BatchCard } from "@/components/batch/batch-card";
import { BatchCardSkeleton } from "@/components/batch/batch-card-skeleton";
import { Button } from "@/components/ui/button";
import { useBatches } from "@/hooks/use-batches";
import { computeAttention } from "@/lib/attention";
import { getSeedTemplate } from "@/lib/seed-data";
import { Widget, StatTile } from "./widget";

// How many attention cards to surface on the dashboard before deferring to the
// full list. Kept small so the home screen stays scannable on a phone.
const MAX_PREVIEW = 2;

export function FermentsWidget() {
  const batchesQuery = useBatches();

  const active = (batchesQuery.data ?? []).filter((b) => b.status === "active");
  const scored = active.map((batch) => ({
    batch,
    attention: computeAttention(batch, getSeedTemplate(batch.type) ?? null),
  }));
  const attention = scored
    .filter((item) => item.attention.needsAttention)
    .sort((a, b) => b.attention.priority - a.attention.priority);

  if (batchesQuery.isLoading) {
    return (
      <Widget title="Your ferments" icon={Sprout}>
        <div className="flex flex-col gap-3" aria-busy aria-label="Loading ferments">
          <BatchCardSkeleton />
          <BatchCardSkeleton />
        </div>
      </Widget>
    );
  }

  if (active.length === 0) {
    return (
      <Widget title="Your ferments" icon={Sprout}>
        <p className="text-sm text-secondary">
          No active ferments yet. Start one to begin logging in the field.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/new">＋ Start your first batch</Link>
        </Button>
      </Widget>
    );
  }

  const preview = (attention.length > 0 ? attention : scored).slice(0, MAX_PREVIEW);
  const previewLabel = attention.length > 0 ? "Needs attention" : "Recently active";

  return (
    <Widget title="Your ferments" icon={Sprout} action={{ href: "/batches", label: "View all" }}>
      <div className="flex gap-2">
        <StatTile label="Active" value={active.length} tone="accent" />
        <StatTile
          label="Need attention"
          value={attention.length}
          tone={attention.length > 0 ? "attention" : "default"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-muted">
          {previewLabel}
        </h3>
        {preview.map(({ batch, attention: info }, i) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            hint={info.hint}
            emphasis={i === 0 ? "focus" : "default"}
          />
        ))}
      </div>

      {batchesQuery.error ? (
        <p className="text-xs text-status-needs-action-text" role="alert">
          Showing what is saved on this device.
        </p>
      ) : null}
    </Widget>
  );
}
