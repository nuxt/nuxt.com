CREATE TABLE `template_check_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text,
	`state` text NOT NULL,
	`trigger` text NOT NULL,
	`started_by` text,
	`total` integer NOT NULL,
	`browser` text,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE INDEX `template_check_runs_started_at_idx` ON `template_check_runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `template_checks` (
	`slug` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`phase` text,
	`phases` text,
	`status` text,
	`step` text,
	`nuxt` text,
	`snapshot_id` text,
	`run_id` text,
	`batch_id` text,
	`sandbox` text,
	`log` text,
	`seconds` integer,
	`started_at` integer,
	`checked_at` integer,
	`passed_at` integer
);
