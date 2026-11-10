CREATE TABLE `mcp_oauth_clients` (
	`registration_key` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`redirect_uris` text NOT NULL,
	`grants` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mcp_oauth_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`user_id` text NOT NULL,
	`resource` text NOT NULL,
	`code_hash` text NOT NULL,
	`code_expires_at` integer NOT NULL,
	`code_used_at` integer,
	`redirect_uri` text NOT NULL,
	`challenge` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `mcp_oauth_clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_oauth_grants_code_hash_unique` ON `mcp_oauth_grants` (`code_hash`);--> statement-breakpoint
CREATE INDEX `mcp_oauth_grants_user_idx` ON `mcp_oauth_grants` (`user_id`);--> statement-breakpoint
CREATE TABLE `mcp_oauth_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grant_id` text NOT NULL,
	`client_id` text NOT NULL,
	`access_hash` text NOT NULL,
	`access_expires_at` integer NOT NULL,
	`refresh_hash` text NOT NULL,
	`refresh_expires_at` integer NOT NULL,
	`refresh_used_at` integer,
	FOREIGN KEY (`grant_id`) REFERENCES `mcp_oauth_grants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `mcp_oauth_clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_oauth_tokens_access_hash_unique` ON `mcp_oauth_tokens` (`access_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_oauth_tokens_refresh_hash_unique` ON `mcp_oauth_tokens` (`refresh_hash`);--> statement-breakpoint
CREATE INDEX `mcp_oauth_tokens_grant_idx` ON `mcp_oauth_tokens` (`grant_id`);