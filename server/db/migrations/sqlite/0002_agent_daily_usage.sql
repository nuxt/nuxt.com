CREATE TABLE IF NOT EXISTS `agent_daily_usage` (
	`day_key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `agent_chats_fingerprint_idx` ON `agent_chats` (`fingerprint`);