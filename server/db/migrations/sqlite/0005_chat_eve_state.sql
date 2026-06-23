ALTER TABLE `chats` ADD `state` text;--> statement-breakpoint
-- Eve message ids (e.g. turn_0:user) are unique per chat, not globally.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`parts` text,
	`model` text,
	`provider` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`chat_id`, `id`),
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_messages`("id", "chat_id", "role", "parts", "model", "provider", "metadata", "created_at") SELECT "id", "chat_id", "role", "parts", "model", "provider", "metadata", "created_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
CREATE TABLE `__new_votes` (
	`chat_id` text NOT NULL,
	`message_id` text NOT NULL,
	`is_upvoted` integer NOT NULL,
	`created_at` integer,
	PRIMARY KEY(`chat_id`, `message_id`),
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chat_id`, `message_id`) REFERENCES `messages`(`chat_id`, `id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_votes`("chat_id", "message_id", "is_upvoted", "created_at") SELECT "chat_id", "message_id", "is_upvoted", "created_at" FROM `votes`;--> statement-breakpoint
DROP TABLE `votes`;--> statement-breakpoint
ALTER TABLE `__new_votes` RENAME TO `votes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
