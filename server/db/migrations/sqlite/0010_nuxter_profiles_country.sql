ALTER TABLE `nuxter_profiles` ADD `country` text;--> statement-breakpoint
CREATE INDEX `nuxter_profiles_country_idx` ON `nuxter_profiles` (`country`);