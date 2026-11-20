CREATE TABLE `agent_memory` (
	`key` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`version` integer NOT NULL,
	`user_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_memory_updated_at_idx` ON `agent_memory` (`updated_at`);