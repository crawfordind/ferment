import type { FermentType } from "@/lib/schema";

// Shared types for the Kombucha Buddy — the LLM agentic assistant. The buddy is
// a tool-using agent scoped to one signed-in user's batches: it reads the same
// derived-domain helpers the UI already uses (pulse, attention, troubleshooting,
// knowledge base) and can *propose* writes that the client applies only after the
// user confirms. Nothing here touches the DB directly; see `lib/assistant/tools.ts`
// for the dependency-injected data source the route wires to the real services.

/** A turn in the buddy conversation, as exchanged with the client. */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** A batch as the buddy's tools see it — the subset the derived helpers need. */
export type AssistantBatch = {
  id: string;
  name: string;
  code: string;
  type: FermentType;
  category: string;
  status: string;
  health: string;
  startedAt: number;
};

/** An observation as the buddy's tools see it. */
export type AssistantObservation = {
  observedAt: number;
  ph: number | null;
  brix: number | null;
  tempC: number | null;
  chipKeys: string[];
  note: string | null;
};

/**
 * User-scoped data access for the read tools. The route implements this against
 * `getDb()` + the batch/observation services; tests implement it with fixtures.
 * Every method is already scoped to the signed-in user by the implementation.
 */
export interface AssistantDataSource {
  listActiveBatches(): Promise<AssistantBatch[]>;
  getBatch(batchId: string): Promise<AssistantBatch | null>;
  getObservations(batchId: string): Promise<AssistantObservation[]>;
}

/**
 * A confirm-gated write the buddy wants to make. The server never applies it —
 * it returns the proposal to the client, which shows a confirm/dismiss control
 * and, on confirm, calls the existing write path (observation create, or a deep
 * link to the New Batch flow). This keeps every mutation behind a human step.
 */
export type Proposal =
  | {
      kind: "log_observation";
      /** One-line summary rendered on the confirm card. */
      summary: string;
      batchId: string;
      batchName: string;
      note: string | null;
      chipKeys: string[];
      ph: number | null;
      brix: number | null;
      tempC: number | null;
    }
  | {
      kind: "start_batch";
      summary: string;
      fermentType: FermentType;
      name: string | null;
    };

/** What `POST /api/assistant` returns. */
export type AssistantReply = {
  /** The buddy's final natural-language message. */
  message: string;
  /** Confirm-gated writes for the client to surface, if any. */
  proposals: Proposal[];
};
