export function BatchCardSkeleton() {
  return (
    <div className="flex items-stretch overflow-hidden rounded-[var(--radius-card)] border-2 border-hairline bg-card">
      <span aria-hidden className="w-1.5 shrink-0 bg-hairline" />
      <div className="m-2 size-[52px] shrink-0 animate-pulse rounded-lg bg-subtle-fill" />
      <div className="flex flex-1 flex-col justify-center gap-2 py-3 pr-2">
        <div className="h-4 w-2/5 animate-pulse rounded bg-subtle-fill" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-subtle-fill" />
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 py-2 pr-3">
        <div className="h-6 w-14 animate-pulse rounded-full bg-subtle-fill" />
        <div className="h-3 w-16 animate-pulse rounded bg-subtle-fill" />
      </div>
    </div>
  );
}
