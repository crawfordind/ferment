const MS_PER_DAY = 86_400_000;

export function computeDayInProcess(
  startedAt: number,
  observedAt: number = Date.now(),
): number {
  return Math.max(0, Math.floor((observedAt - startedAt) / MS_PER_DAY));
}
