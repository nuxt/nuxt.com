PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `users_new` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`username` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `users_new` SELECT `id`, `email`, `name`, `avatar`, `username`, `provider`, `provider_id`, `role`, `created_at` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `users_new` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_provider_id_idx` ON `users` (`provider`,`provider_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
