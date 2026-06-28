import { z } from "zod";

export const batchStatusSchema = z.enum(["active", "finished", "archived"]);
export const batchHealthSchema = z.enum(["on_track", "watch", "needs_action"]);
export const transcriptStatusSchema = z.enum([
  "none",
  "pending",
  "done",
  "failed",
]);
export const uploadStatusSchema = z.enum(["pending", "done", "failed"]);
export const fermentTypeSchema = z.enum([
  "fpj",
  "ffj",
  "labs",
  "fish",
  "plant",
  "custom",
]);

export const batchUpsertSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  type: fermentTypeSchema,
  templateId: z.string().min(1),
  sizeValue: z.number().nullable().optional(),
  sizeUnit: z.string().nullable().optional(),
  status: batchStatusSchema,
  health: batchHealthSchema,
  startedAt: z.number().int(),
  finishedAt: z.number().int().nullable().optional(),
  currentStageIndex: z.number().int().default(0),
  thumbnailPhotoId: z.string().nullable().optional(),
  lotId: z.string().nullable().optional(),
  coaUrl: z.string().nullable().optional(),
  sopVersion: z.string().nullable().optional(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const batchPatchSchema = batchUpsertSchema
  .partial()
  .omit({ id: true, createdAt: true })
  .extend({
    updatedAt: z.number().int(),
  });

export const observationUpsertSchema = z.object({
  id: z.string().min(1),
  batchId: z.string().min(1),
  observedAt: z.number().int(),
  note: z.string().nullable().optional(),
  voiceAudioKey: z.string().nullable().optional(),
  voiceTranscript: z.string().nullable().optional(),
  transcriptStatus: transcriptStatusSchema,
  chipKeys: z.array(z.string()).default([]),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const photoUpsertSchema = z.object({
  id: z.string().min(1),
  batchId: z.string().min(1),
  observationId: z.string().nullable().optional(),
  r2Key: z.string().min(1),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  takenAt: z.number().int(),
  uploadStatus: uploadStatusSchema,
  createdAt: z.number().int(),
});

export const photoPresignRequestSchema = z.object({
  photoId: z.string().min(1),
  ext: z
    .string()
    .min(1)
    .max(5)
    .regex(/^[a-z0-9]+$/i, "ext must be alphanumeric")
    .default("jpg"),
  prefix: z.enum(["photos", "audio"]).default("photos"),
});

export type PhotoPresignRequest = z.infer<typeof photoPresignRequestSchema>;
export type PhotoPresignResponse = {
  uploadUrl: string;
  r2Key: string;
  publicUrl: string;
};

export type BatchUpsertInput = z.infer<typeof batchUpsertSchema>;
export type BatchPatchInput = z.infer<typeof batchPatchSchema>;
export type ObservationUpsertInput = z.infer<typeof observationUpsertSchema>;
export type PhotoUpsertInput = z.infer<typeof photoUpsertSchema>;

export type BatchDto = BatchUpsertInput;
export type ObservationDto = ObservationUpsertInput & {
  dayInProcess: number;
  chipKeys: string[];
};
export type PhotoDto = PhotoUpsertInput;
