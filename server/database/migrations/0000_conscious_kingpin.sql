CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rating` text NOT NULL,
	`feedback` text,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`stem` text NOT NULL,
	`country` text NOT NULL,
	`fingerprint` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `path_fingerprint_idx` ON `feedback` (`path`,`fingerprint`);