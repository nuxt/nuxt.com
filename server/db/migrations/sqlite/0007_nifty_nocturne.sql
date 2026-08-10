CREATE TABLE `mcp_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tool_name` text,
	`feedback` text NOT NULL,
	`suggested_fix` text,
	`path` text,
	`source` text DEFAULT 'mcp' NOT NULL,
	`fingerprint` text NOT NULL,
	`country` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mcp_feedback_created_at_idx` ON `mcp_feedback` (`created_at`);--> statement-breakpoint
CREATE INDEX `mcp_feedback_fingerprint_idx` ON `mcp_feedback` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `mcp_feedback_source_idx` ON `mcp_feedback` (`source`,`created_at`);--> statement-breakpoint
CREATE TABLE `mcp_feedback_daily_usage` (
	`fingerprint` text NOT NULL,
	`day_key` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`fingerprint`, `day_key`)
);
