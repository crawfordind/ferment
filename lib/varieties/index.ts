import { VARIETIES } from "./generated";
import type { Variety, VarietyCategory } from "./types";

export type { Variety, VarietyCategory } from "./types";

/**
 * The market season the availability chart renders: April through October.
 * `startWeek`/`endWeek` bound the horizontal axis so a variety's bar is placed
 * as a fraction of the visible season, not the whole year.
 */
export const SEASON = {
  months: [
    { num: 4, label: "April", short: "Apr" },
    { num: 5, label: "May", short: "May" },
    { num: 6, label: "June", short: "Jun" },
    { num: 7, label: "July", short: "Jul" },
    { num: 8, label: "August", short: "Aug" },
    { num: 9, label: "September", short: "Sep" },
    { num: 10, label: "October", short: "Oct" },
  ],
  startWeek: 14, // ~first week of April
  endWeek: 44, // ~last week of October
} as const;

export const CATEGORY_META: Record<VarietyCategory, { label: string; order: number }> = {
  focal: { label: "Focal", order: 1 },
  spike: { label: "Spike", order: 2 },
  filler: { label: "Filler", order: 3 },
  foliage: { label: "Foliage", order: 4 },
  specialty: { label: "Specialty", order: 5 },
};

// Cumulative day-of-year at the start of each month (non-leap). Used to map an
// ISO week to a calendar month deterministically — no `Date`, so server and
// client always agree and hydration never mismatches.
const MONTH_START_DAY = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Approximate calendar month (1–12) an ISO week falls in (by the week's start day). */
export function weekToMonth(week: number): number {
  const dayOfYear = (week - 1) * 7 + 1; // first day of the week
  let month = 12;
  for (let m = 0; m < 12; m++) {
    if (dayOfYear < (MONTH_START_DAY[m + 1] ?? 366)) {
      month = m + 1;
      break;
    }
  }
  return month;
}

/**
 * Horizontal placement of a variety's availability bar as a 0–100 percentage
 * across the visible season. Clamped so an early/late variety never overflows
 * the axis.
 */
export function seasonBar(variety: Variety): { leftPct: number; widthPct: number } {
  const span = SEASON.endWeek - SEASON.startWeek;
  const from = Math.max(variety.availableFromWeek, SEASON.startWeek);
  const to = Math.min(variety.availableToWeek, SEASON.endWeek);
  const leftPct = ((from - SEASON.startWeek) / span) * 100;
  const widthPct = (Math.max(to - from, 0) / span) * 100;
  return {
    leftPct: Math.max(0, Math.min(100, leftPct)),
    widthPct: Math.max(2, Math.min(100 - leftPct, widthPct)), // min 2% so a one-week window is still visible
  };
}

/** True if the variety is cuttable during the given calendar month. */
export function availableInMonth(variety: Variety, month: number): boolean {
  return weekToMonth(variety.availableFromWeek) <= month && weekToMonth(variety.availableToWeek) >= month;
}

export function getAllVarieties(): Variety[] {
  return VARIETIES;
}

/** Only the varieties Daniel will grow to a wholesale contract order. */
export function getContractVarieties(): Variety[] {
  return VARIETIES.filter((v) => v.availableForContract);
}

/** Human window label, e.g. "May – September", for the row's screen-reader text. */
export function windowLabel(variety: Variety): string {
  const from = SEASON.months.find((m) => m.num === weekToMonth(variety.availableFromWeek));
  const to = SEASON.months.find((m) => m.num === weekToMonth(variety.availableToWeek));
  const fromLabel = from?.label ?? "early season";
  const toLabel = to?.label ?? "late season";
  return fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
}
