ALTER TABLE `batches` ADD `inputs` text;--> statement-breakpoint
ALTER TABLE `batches` ADD `yield_value` real;--> statement-breakpoint
ALTER TABLE `batches` ADD `yield_unit` text;--> statement-breakpoint
ALTER TABLE `batches` ADD `cost_amount` real;--> statement-breakpoint
ALTER TABLE `observations` ADD `ph` real;--> statement-breakpoint
ALTER TABLE `observations` ADD `brix` real;--> statement-breakpoint
ALTER TABLE `observations` ADD `temp_c` real;