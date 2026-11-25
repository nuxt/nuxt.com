CREATE TABLE IF NOT EXISTS `mcp_oauth_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`family_id` text NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`scope` text NOT NULL,
	`redirect_uri` text,
	`code_challenge` text,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `mcp_oauth_grants_family_idx` ON `mcp_oauth_grants` (`family_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `mcp_oauth_grants_expires_idx` ON `mcp_oauth_grants` (`expires_at`);