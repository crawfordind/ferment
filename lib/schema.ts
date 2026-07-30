import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: integer("created_at").notNull(),
  lastLoginAt: integer("last_login_at"),
});

/**
 * One row per issued magic link. Only the SHA-256 `tokenHash` is stored, never
 * the raw token. `consumedAt` makes a link single-use.
 */
export const loginTokens = sqliteTable("login_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  createdAt: integer("created_at").notNull(),
});

export const templates = sqliteTable(
  "templates",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    defaultUnit: text("default_unit").notNull(),
  },
  (table) => [unique("templates_category_type_unique").on(table.category, table.type)],
);

export const templateStages = sqliteTable("template_stages", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .references(() => templates.id),
  stageIndex: integer("stage_index").notNull(),
  name: text("name").notNull(),
  dayStart: integer("day_start").notNull(),
  dayEnd: integer("day_end"),
  expectationText: text("expectation_text").notNull(),
  actionLabel: text("action_label"),
});

export const batches = sqliteTable("batches", {
  id: text("id").primaryKey(),
  /**
   * Owner. Nullable at the column level so it could be added to the existing
   * table without a rebuild (migration 0003 backfills every prior row to the
   * seed user); the service layer always sets it and scopes every read/write by
   * it, so it is effectively non-null in practice.
   */
  userId: text("user_id").references(() => users.id),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  templateId: text("template_id")
    .notNull()
    .references(() => templates.id),
  sizeValue: real("size_value"),
  sizeUnit: text("size_unit"),
  status: text("status").notNull(),
  health: text("health").notNull(),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  currentStageIndex: integer("current_stage_index").notNull().default(0),
  thumbnailPhotoId: text("thumbnail_photo_id"),
  /** Recipe/inputs as a JSON-encoded BatchInput[] (see lib/inputs.ts). */
  inputs: text("inputs"),
  /** Finished output and input cost for cost-per-unit (see lib/economics.ts). */
  yieldValue: real("yield_value"),
  yieldUnit: text("yield_unit"),
  costAmount: real("cost_amount"),
  lotId: text("lot_id"),
  coaUrl: text("coa_url"),
  sopVersion: text("sop_version"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const observations = sqliteTable("observations", {
  id: text("id").primaryKey(),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id),
  observedAt: integer("observed_at").notNull(),
  dayInProcess: integer("day_in_process").notNull(),
  note: text("note"),
  voiceAudioKey: text("voice_audio_key"),
  voiceTranscript: text("voice_transcript"),
  transcriptStatus: text("transcript_status").notNull(),
  /** Quantitative readings (nullable; captured during a check-in). */
  ph: real("ph"),
  brix: real("brix"),
  tempC: real("temp_c"),
  /** Application record as JSON-encoded Application (see lib/applications.ts). */
  application: text("application"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const observationChips = sqliteTable(
  "observation_chips",
  {
    observationId: text("observation_id")
      .notNull()
      .references(() => observations.id),
    chipKey: text("chip_key").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.observationId, table.chipKey] }),
  ],
);

/**
 * Quote-request submissions from the public farm site (`/request`). One row per
 * inquiry, across every service line (contract growing, bloom bar, wedding,
 * design). The service-specific answers live in `payload` as a JSON-encoded
 * object so the single "one form engine, one submission table" design from the
 * PRD holds without a column per service. `status` drives Daniel's inbox
 * triage; `source` captures the "how did you hear about us" answer.
 */
export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  serviceType: text("service_type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"),
  notes: text("notes"),
  /** Branch-specific answers as a JSON-encoded object (see lib/request). */
  payload: text("payload"),
  status: text("status").notNull().default("new"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id),
  observationId: text("observation_id").references(() => observations.id),
  r2Key: text("r2_key").notNull(),
  width: integer("width"),
  height: integer("height"),
  takenAt: integer("taken_at").notNull(),
  uploadStatus: text("upload_status").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const templatesRelations = relations(templates, ({ many }) => ({
  stages: many(templateStages),
  batches: many(batches),
}));

export const templateStagesRelations = relations(templateStages, ({ one }) => ({
  template: one(templates, {
    fields: [templateStages.templateId],
    references: [templates.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  batches: many(batches),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  owner: one(users, {
    fields: [batches.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [batches.templateId],
    references: [templates.id],
  }),
  observations: many(observations),
  photos: many(photos),
}));

export const observationsRelations = relations(observations, ({ one, many }) => ({
  batch: one(batches, {
    fields: [observations.batchId],
    references: [batches.id],
  }),
  chips: many(observationChips),
  photos: many(photos),
}));

export const observationChipsRelations = relations(observationChips, ({ one }) => ({
  observation: one(observations, {
    fields: [observationChips.observationId],
    references: [observations.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  batch: one(batches, {
    fields: [photos.batchId],
    references: [batches.id],
  }),
  observation: one(observations, {
    fields: [photos.observationId],
    references: [observations.id],
  }),
}));

export type BatchStatus = "active" | "finished" | "archived";
export type BatchHealth = "on_track" | "watch" | "needs_action";
export type TranscriptStatus = "none" | "pending" | "done" | "failed";
export type UploadStatus = "pending" | "done" | "failed";
export type FermentType =
  | "fpj"
  | "ffj"
  | "labs"
  | "fish"
  | "plant"
  | "food"
  | "custom";

export type User = typeof users.$inferSelect;
export type LoginToken = typeof loginTokens.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type TemplateStage = typeof templateStages.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Observation = typeof observations.$inferSelect;
export type ObservationChip = typeof observationChips.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;

/** Public farm service lines. Drives the `/request` branching + inbox subjects. */
export type ServiceType =
  | "contract-growing"
  | "bloom-bar"
  | "wedding"
  | "design";
export type InquiryStatus = "new" | "in_progress" | "quoted" | "closed";
