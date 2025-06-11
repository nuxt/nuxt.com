CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rating` text NOT NULL,
	`feedback` text,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`fingerprint` text NOT NULL,
	`createdAt` integer NOT NULL
);
