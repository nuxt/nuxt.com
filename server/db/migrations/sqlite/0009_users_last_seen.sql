ALTER TABLE `users` ADD `last_seen_at` integer;--> statement-breakpoint
-- Existing accounts start their inactivity window from this migration.
UPDATE `users` SET `last_seen_at` = unixepoch() WHERE `last_seen_at` IS NULL;
