CREATE TABLE `batches` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`template_id` text NOT NULL,
	`size_value` real,
	`size_unit` text,
	`status` text NOT NULL,
	`health` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`current_stage_index` integer DEFAULT 0 NOT NULL,
	`thumbnail_photo_id` text,
	`lot_id` text,
	`coa_url` text,
	`sop_version` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `batches_code_unique` ON `batches` (`code`);--> statement-breakpoint
CREATE TABLE `observation_chips` (
	`observation_id` text NOT NULL,
	`chip_key` text NOT NULL,
	PRIMARY KEY(`observation_id`, `chip_key`),
	FOREIGN KEY (`observation_id`) REFERENCES `observations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	`day_in_process` integer NOT NULL,
	`note` text,
	`voice_audio_key` text,
	`voice_transcript` text,
	`transcript_status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`observation_id` text,
	`r2_key` text NOT NULL,
	`width` integer,
	`height` integer,
	`taken_at` integer NOT NULL,
	`upload_status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`observation_id`) REFERENCES `observations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`stage_index` integer NOT NULL,
	`name` text NOT NULL,
	`day_start` integer NOT NULL,
	`day_end` integer,
	`expectation_text` text NOT NULL,
	`action_label` text,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`default_unit` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `templates_category_type_unique` ON `templates` (`category`,`type`);