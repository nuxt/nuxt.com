-- Purge anonymous chats while FK enforcement is still on (cascades to messages/votes).
DELETE FROM `chats` WHERE `user_id` NOT IN (SELECT `id` FROM `users`);--> statement-breakpoint
CREATE TABLE `agent_stats` (
	`day_key` text NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`chats_started` integer DEFAULT 0 NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day_key`, `user_id`, `provider`, `model`)
);
--> statement-breakpoint
CREATE INDEX `agent_stats_day_key_idx` ON `agent_stats` (`day_key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- New PK shape (user_id, day_key); previous rows were IP-keyed, no value in migrating them.
DROP TABLE `agent_daily_usage`;--> statement-breakpoint
CREATE TABLE `agent_daily_usage` (
	`user_id` text NOT NULL,
	`day_key` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`limit_override` integer,
	PRIMARY KEY(`user_id`, `day_key`)
);
--> statement-breakpoint
CREATE INDEX `agent_daily_usage_day_key_idx` ON `agent_daily_usage` (`day_key`);--> statement-breakpoint
CREATE TABLE `__new_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`user_id` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`parent_chat_id` text,
	`metadata` text,
	`model` text,
	`provider` text,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_chats`("id", "title", "user_id", "visibility", "model", "provider", "input_tokens", "output_tokens", "estimated_cost", "duration_ms", "request_count", "updated_at", "created_at") SELECT "id", "title", "user_id", "visibility", "model", "provider", "input_tokens", "output_tokens", "estimated_cost", "duration_ms", "request_count", "updated_at", "created_at" FROM `chats`;--> statement-breakpoint
DROP TABLE `chats`;--> statement-breakpoint
ALTER TABLE `__new_chats` RENAME TO `chats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `chats_user_id_idx` ON `chats` (`user_id`);--> statement-breakpoint
CREATE INDEX `chats_parent_chat_id_idx` ON `chats` (`parent_chat_id`);--> statement-breakpoint
ALTER TABLE `messages` ADD `model` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `provider` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `users` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `votes` ADD `created_at` integer;
