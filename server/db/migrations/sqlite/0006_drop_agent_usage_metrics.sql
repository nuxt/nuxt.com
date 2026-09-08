-- Usage metrics (tokens, cost, duration) and agent_stats are superseded by Vercel Eve observability.
DROP TABLE IF EXISTS `agent_stats`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`user_id` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`parent_chat_id` text,
	`metadata` text,
	`updated_at` integer,
	`state` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_chats`("id", "title", "user_id", "visibility", "parent_chat_id", "metadata", "updated_at", "state", "created_at") SELECT "id", "title", "user_id", "visibility", "parent_chat_id", "metadata", "updated_at", "state", "created_at" FROM `chats`;--> statement-breakpoint
DROP TABLE `chats`;--> statement-breakpoint
ALTER TABLE `__new_chats` RENAME TO `chats`;--> statement-breakpoint
CREATE INDEX `chats_user_id_idx` ON `chats` (`user_id`);--> statement-breakpoint
CREATE INDEX `chats_parent_chat_id_idx` ON `chats` (`parent_chat_id`);--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`parts` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`chat_id`, `id`),
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "chat_id", "role", "parts", "metadata", "created_at") SELECT "id", "chat_id", "role", "parts", "metadata", "created_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
