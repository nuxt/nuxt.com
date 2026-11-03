CREATE TABLE `l10n_saves` (
	`user_id` text NOT NULL,
	`hour` integer NOT NULL,
	`saves` integer NOT NULL,
	`changes` integer NOT NULL,
	PRIMARY KEY(`user_id`, `hour`)
);
--> statement-breakpoint
CREATE INDEX `l10n_saves_hour_idx` ON `l10n_saves` (`hour`);