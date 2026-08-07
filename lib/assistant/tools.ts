import { z } from "zod";

import { computeAttention } from "@/lib/attention";
import { computeBatchPulse } from "@/lib/batch-pulse";
import { getChip } from "@/lib/chips";
import { computeDayInProcess } from "@/lib/day";
import { fermentTypeSchema } from "@/lib/api/schemas";
import { getDocByFermentType, searchDocs } from "@/lib/knowledge";
import { getSeedTemplate } from "@/lib/seed-data";
import { getGuidanceForChips } from "@/lib/troubleshooting";
import type { FermentType } from "@/lib/schema";
import type { AssistantDataSource, Proposal } from "@/lib/assistant/types";

// The buddy's tool surface. Read tools run server-side inside the agent loop and
// return plain JSON the model reasons over. Write tools never touch the DB — they
// build a Proposal that flows back to the client for confirmation. Both kinds are
// thin wrappers over the same pure helpers the UI uses, so the buddy can never be
// "more sure" than the app's own status engine.

/** OpenAI-compatible tool schema (OpenRouter passes these straight through). */
export type ToolSchema = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const READ_TOOL_NAMES = [
  "list_batches",
  "get_batch_pulse",
  "get_attention",
  "search_knowledge",
  "check_signs",
] as const;

const WRITE_TOOL_NAMES = [
  "propose_log_observation",
  "propose_start_batch",
] as const;

export type ReadToolName = (typeof READ_TOOL_NAMES)[number];
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

const READ_SET = new Set<string>(READ_TOOL_NAMES);
const WRITE_SET = new Set<string>(WRITE_TOOL_NAMES);

export function isReadTool(name: string): name is ReadToolName {
  return READ_SET.has(name);
}
export function isWriteTool(name: string): name is WriteToolName {
  return WRITE_SET.has(name);
}

// --- Tool schemas advertised to the model ---------------------------------

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "list_batches",
      description:
        "List the user's active ferments (id, name, code, type, day-in-process, health). Call this first to resolve a batch the user names into an id.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_batch_pulse",
      description:
        "Factual snapshot for one batch: check-in cadence, the pH/Brix/temp trend, the next scheduled milestone, and why its health isn't on-track. Use to answer 'how is X doing?' or 'when do I bottle X?'.",
      parameters: {
        type: "object",
        properties: {
          batchId: {
            type: "string",
            description: "Batch id from list_batches.",
          },
        },
        required: ["batchId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_attention",
      description:
        "What needs the user's attention: overdue/due-today stage actions and health warnings. Omit batchId to scan all active batches.",
      parameters: {
        type: "object",
        properties: {
          batchId: {
            type: "string",
            description: "Optional: limit to one batch.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Search the bundled recipe & concept knowledge base (KNF ferments plus food & beverage, including kombucha). Returns matching doc summaries with ids for /knowledge/[id].",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search terms, e.g. 'kombucha second ferment'.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_signs",
      description:
        "Grounded 'is this normal?' guidance for sensory chips (e.g. surface_white_film, smell_ammonia). Returns reassure/warning cards with a concrete next step. Prefer this over guessing when the user describes how a ferment looks or smells.",
      parameters: {
        type: "object",
        properties: {
          chipKeys: {
            type: "array",
            items: { type: "string" },
            description: "Sensory chip keys the signs map to.",
          },
          batchType: {
            type: "string",
            description: "Optional ferment type for type-specific overrides.",
          },
        },
        required: ["chipKeys"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_log_observation",
      description:
        "Propose logging a check-in on a batch. This does NOT write anything — it returns a proposal the user must confirm. Use only when the user clearly wants to record an observation.",
      parameters: {
        type: "object",
        properties: {
          batchId: { type: "string" },
          note: { type: "string" },
          chipKeys: { type: "array", items: { type: "string" } },
          ph: { type: "number" },
          brix: { type: "number" },
          tempC: { type: "number" },
        },
        required: ["batchId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_start_batch",
      description:
        "Propose starting a new batch of a given ferment type. Does NOT create anything — returns a proposal that deep-links the user to the New Batch flow to confirm.",
      parameters: {
        type: "object",
        properties: {
          fermentType: {
            type: "string",
            enum: ["fpj", "ffj", "labs", "fish", "plant", "food", "custom"],
          },
          name: { type: "string" },
        },
        required: ["fermentType"],
        additionalProperties: false,
      },
    },
  },
];

// --- Read tool execution --------------------------------------------------

const readArgs = {
  get_batch_pulse: z.object({ batchId: z.string().min(1) }),
  get_attention: z.object({ batchId: z.string().min(1).optional() }),
  search_knowledge: z.object({ query: z.string().min(1) }),
  check_signs: z.object({
    chipKeys: z.array(z.string()),
    batchType: z.string().optional(),
  }),
};

/** How many knowledge hits to hand the model — enough to answer, small enough to stay cheap. */
const KNOWLEDGE_LIMIT = 5;

/**
 * Run a read tool and return a compact, JSON-serializable result for the model.
 * Throws on unknown tool or a batch the user can't see — the loop turns that into
 * an error tool-result the model can recover from.
 */
export async function executeReadTool(
  name: ReadToolName,
  rawArgs: unknown,
  ds: AssistantDataSource,
  now: number = Date.now(),
): Promise<unknown> {
  switch (name) {
    case "list_batches": {
      const batches = await ds.listActiveBatches();
      return {
        batches: batches.map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          type: b.type,
          day: computeDayInProcess(b.startedAt, now),
          health: b.health,
        })),
      };
    }

    case "get_batch_pulse": {
      const { batchId } = readArgs.get_batch_pulse.parse(rawArgs);
      const batch = await ds.getBatch(batchId);
      if (!batch) return { error: "No such batch for this user." };
      const observations = await ds.getObservations(batchId);
      const template = getSeedTemplate(batch.type) ?? null;
      const pulse = computeBatchPulse(
        {
          startedAt: batch.startedAt,
          type: batch.type,
          health: batch.health as never,
          status: batch.status,
        },
        observations.map((o) => ({
          observedAt: o.observedAt,
          ph: o.ph,
          brix: o.brix,
          tempC: o.tempC,
          chipKeys: o.chipKeys,
        })),
        template,
        now,
      );
      return {
        batch: { id: batch.id, name: batch.name, type: batch.type },
        pulse,
      };
    }

    case "get_attention": {
      const { batchId } = readArgs.get_attention.parse(rawArgs);
      const batches = batchId
        ? [await ds.getBatch(batchId)].filter(
            (b): b is NonNullable<typeof b> => b !== null,
          )
        : await ds.listActiveBatches();
      const items = batches
        .map((b) => {
          const template = getSeedTemplate(b.type) ?? null;
          const attention = computeAttention(
            {
              startedAt: b.startedAt,
              status: b.status,
              health: b.health as never,
            },
            template,
            now,
          );
          return { batchId: b.id, name: b.name, code: b.code, ...attention };
        })
        .filter((a) => a.needsAttention)
        .sort((a, b) => b.priority - a.priority);
      return { items };
    }

    case "search_knowledge": {
      const { query } = readArgs.search_knowledge.parse(rawArgs);
      const docs = searchDocs(query).slice(0, KNOWLEDGE_LIMIT);
      return {
        results: docs.map((d) => ({
          id: d.id,
          title: d.title,
          section: d.section,
          category: d.category,
          summary: d.summary,
        })),
      };
    }

    case "check_signs": {
      const { chipKeys, batchType } = readArgs.check_signs.parse(rawArgs);
      const type = fermentTypeSchema.safeParse(batchType);
      const guidance = getGuidanceForChips(
        chipKeys,
        type.success ? type.data : undefined,
      );
      return {
        guidance: guidance.map((g) => ({
          chipKey: g.chipKey,
          tone: g.tone,
          title: g.title,
          whatItMeans: g.whatItMeans,
          whatToDo: g.whatToDo,
        })),
      };
    }
  }
}

// --- Write tool proposals (confirm-gated; never applied server-side) -------

const writeArgs = {
  propose_log_observation: z.object({
    batchId: z.string().min(1),
    note: z.string().optional(),
    chipKeys: z.array(z.string()).optional(),
    ph: z.number().optional(),
    brix: z.number().optional(),
    tempC: z.number().optional(),
  }),
  propose_start_batch: z.object({
    fermentType: fermentTypeSchema,
    name: z.string().optional(),
  }),
};

export type ProposalOutcome = {
  /** The proposal to surface, or null when the args don't resolve (e.g. unknown batch). */
  proposal: Proposal | null;
  /** The tool-result text handed back to the model so it can wrap up. */
  toolResult: string;
};

/**
 * Build a confirm-gated proposal from a write tool call. Validates references
 * against the user's data but performs no mutation.
 */
export async function buildProposal(
  name: WriteToolName,
  rawArgs: unknown,
  ds: AssistantDataSource,
): Promise<ProposalOutcome> {
  if (name === "propose_log_observation") {
    const args = writeArgs.propose_log_observation.parse(rawArgs);
    const batch = await ds.getBatch(args.batchId);
    if (!batch) {
      return {
        proposal: null,
        toolResult: "No such batch for this user; nothing proposed.",
      };
    }
    // Drop chip keys the app doesn't know so a stale suggestion never lands.
    const chipKeys = (args.chipKeys ?? []).filter((key) => getChip(key));
    const parts = [
      args.note ? `note "${args.note}"` : null,
      chipKeys.length ? `signs ${chipKeys.join(", ")}` : null,
      args.ph != null ? `pH ${args.ph}` : null,
      args.brix != null ? `Brix ${args.brix}` : null,
      args.tempC != null ? `${args.tempC}°C` : null,
    ].filter(Boolean);
    const summary = `Log a check-in on ${batch.name}${parts.length ? `: ${parts.join(", ")}` : ""}`;
    return {
      proposal: {
        kind: "log_observation",
        summary,
        batchId: batch.id,
        batchName: batch.name,
        note: args.note ?? null,
        chipKeys,
        ph: args.ph ?? null,
        brix: args.brix ?? null,
        tempC: args.tempC ?? null,
      },
      toolResult:
        "Proposed a check-in. It will only be saved if the user confirms.",
    };
  }

  const args = writeArgs.propose_start_batch.parse(rawArgs);
  const doc = getDocByFermentType(args.fermentType);
  const label = doc?.title ?? (args.fermentType as FermentType);
  return {
    proposal: {
      kind: "start_batch",
      summary: `Start a new ${label} batch`,
      fermentType: args.fermentType,
      name: args.name ?? null,
    },
    toolResult:
      "Proposed starting a batch. It opens the New Batch flow only if the user confirms.",
  };
}
