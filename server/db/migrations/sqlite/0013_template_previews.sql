-- The shared preview database has this table from an earlier version of this migration, keyed by owner.
DROP TABLE IF EXISTS `template_previews`;--> statement-breakpoint
CREATE TABLE `template_previews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`reserved_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `template_previews_owner_idx` ON `template_previews` (`owner`);--> statement-breakpoint
CREATE INDEX `template_previews_expires_at_idx` ON `template_previews` (`expires_at`);