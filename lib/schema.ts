import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

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

export const batchesRelations = relations(batches, ({ one, many }) => ({
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
  | "custom";

export type Template = typeof templates.$inferSelect;
export type TemplateStage = typeof templateStages.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Observation = typeof observations.$inferSelect;
export type ObservationChip = typeof observationChips.$inferSelect;
export type Photo = typeof photos.$inferSelect;
