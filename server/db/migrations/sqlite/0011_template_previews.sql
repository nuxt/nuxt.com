CREATE TABLE `template_previews` (
	`owner` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `template_previews_expires_at_idx` ON `template_previews` (`expires_at`);