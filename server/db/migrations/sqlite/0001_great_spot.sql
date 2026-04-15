CREATE TABLE `agent_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`messages` text NOT NULL,
	`fingerprint` text NOT NULL,
	`model` text,
	`provider` text,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` text NOT NULL,
	`message_id` text NOT NULL,
	`is_upvoted` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_vote_chat_msg_idx` ON `agent_votes` (`chat_id`,`message_id`);