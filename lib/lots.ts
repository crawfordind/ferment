/**
 * A traceability lot id for a finished batch: the batch code plus the finish
 * date, e.g. `FPJ-03-20260628`. Uses the operator's local date so the lot
 * matches the day they finished the batch (not a UTC day that can roll over
 * near midnight).
 */
export function generateLotId(code: string, finishedAt: number): string {
  const date = new Date(finishedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${code}-${year}${month}${day}`;
}
