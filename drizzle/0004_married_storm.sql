CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`service_type` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`source` text,
	`notes` text,
	`payload` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
