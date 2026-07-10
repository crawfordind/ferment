CREATE TABLE `login_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `login_tokens_token_hash_unique` ON `login_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `batches` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
INSERT INTO `users` (`id`, `email`, `name`, `created_at`, `last_login_at`) VALUES ('00000000-0000-7000-8000-00000000da01', 'dcrawford.hoeminc@gmail.com', NULL, 1704067200000, NULL) ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE `batches` SET `user_id` = '00000000-0000-7000-8000-00000000da01' WHERE `user_id` IS NULL;