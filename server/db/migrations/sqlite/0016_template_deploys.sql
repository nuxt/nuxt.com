CREATE TABLE `template_deploys` (
	`owner` text PRIMARY KEY NOT NULL,
	`deployed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `template_deploys_deployed_at_idx` ON `template_deploys` (`deployed_at`);