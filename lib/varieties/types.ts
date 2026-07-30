// Variety types. Like the Blog and Knowledge Base, this is git-based content —
// it never touches the batch DB. Each variety is authored as a portable `.md`
// file in `content/varieties/` and compiled at build time into `generated.ts`
// (see `scripts/build-varieties.ts`), so the seasonal availability chart ships
// bundled with no runtime CMS or network.
//
// Availability is stored as an inclusive ISO-week range (the PRD's
// `available_from` / `available_to` "week" fields). Weeks 14–44 span roughly
// April through October, the market season the chart renders.

export type VarietyCategory =
  | "focal" // showy centerpiece blooms (dahlias, peonies…)
  | "spike" // vertical line flowers (snapdragons, delphinium…)
  | "filler" // airy volume (cosmos, ammi…)
  | "foliage" // greenery + texture
  | "specialty"; // hard-to-ship or niche cuts

export type Variety = {
  slug: string;
  name: string;
  /** Latin / cultivar note shown under the name. Optional. */
  botanical?: string;
  category: VarietyCategory;
  /** Inclusive ISO-week the variety first becomes cuttable (1–53). */
  availableFromWeek: number;
  /** Inclusive ISO-week the variety stops being cuttable (1–53). */
  availableToWeek: number;
  /** Whether Daniel will grow this to a wholesale contract order. */
  availableForContract: boolean;
  /** Short trade-facing note (substitution behavior, vase life, colors…). */
  notes?: string;
  /** Optional hero/thumb path under /public. */
  photo?: string;
};
