"use client";

import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useBatches, useCreateBatch } from "@/hooks/use-batches";

export default function DebugPage() {
  const batchesQuery = useBatches();
  const createBatch = useCreateBatch();

  // Phase 2 verification screen — not exposed in production builds.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Debug — data layer</h1>
        <p className="mt-1 text-sm text-secondary">
          Temporary screen for Phase 2 verification.
        </p>
      </div>

      <Button
        className="min-h-tap-primary w-full"
        disabled={createBatch.isPending}
        onClick={() => createBatch.mutate({ type: "fpj", name: "Debug FPJ" })}
      >
        Create test batch
      </Button>

      {batchesQuery.isLoading ? (
        <p className="text-secondary">Loading batches…</p>
      ) : null}

      {batchesQuery.error ? (
        <p className="text-needs-action" role="alert">
          {(batchesQuery.error as Error).message}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {(batchesQuery.data ?? []).map((batch) => (
          <li
            key={batch.id}
            className="border-ink/10 rounded-card border bg-card px-4 py-3"
          >
            <p className="font-semibold text-ink">{batch.name}</p>
            <p className="text-sm text-secondary">
              {batch.code} · {batch.status} · {batch.health}
            </p>
          </li>
        ))}
      </ul>

      {!batchesQuery.isLoading && (batchesQuery.data?.length ?? 0) === 0 ? (
        <p className="text-secondary">No batches yet.</p>
      ) : null}
    </main>
  );
}
