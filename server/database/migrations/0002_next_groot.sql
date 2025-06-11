ALTER TABLE `feedback` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `path_fingerprint_idx` ON `feedback` (`path`,`fingerprint`);