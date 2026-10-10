CREATE TABLE `nuxters` (
	`period` text NOT NULL,
	`github_id` integer NOT NULL,
	`username` text NOT NULL,
	`username_lower` text NOT NULL,
	`rank` integer NOT NULL,
	`score` integer NOT NULL,
	`issues` integer DEFAULT 0 NOT NULL,
	`helpful_issues` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`helpful_comments` integer DEFAULT 0 NOT NULL,
	`reactions` integer DEFAULT 0 NOT NULL,
	`pr_feat` integer DEFAULT 0 NOT NULL,
	`pr_fix` integer DEFAULT 0 NOT NULL,
	`pr_docs` integer DEFAULT 0 NOT NULL,
	`pr_chore` integer DEFAULT 0 NOT NULL,
	`pr_all` integer DEFAULT 0 NOT NULL,
	`core_pr_feat` integer DEFAULT 0 NOT NULL,
	`core_pr_fix` integer DEFAULT 0 NOT NULL,
	`core_pr_docs` integer DEFAULT 0 NOT NULL,
	`core_pr_chore` integer DEFAULT 0 NOT NULL,
	`core_pr_all` integer DEFAULT 0 NOT NULL,
	`core_helpful_issues` integer DEFAULT 0 NOT NULL,
	`core_helpful_comments` integer DEFAULT 0 NOT NULL,
	`first_contribution_at` integer,
	`synced_at` integer NOT NULL,
	PRIMARY KEY(`period`, `github_id`)
);
--> statement-breakpoint
CREATE INDEX `nuxters_period_rank_idx` ON `nuxters` (`period`,`rank`);--> statement-breakpoint
CREATE INDEX `nuxters_period_username_lower_idx` ON `nuxters` (`period`,`username_lower`);--> statement-breakpoint
CREATE INDEX `nuxters_github_id_idx` ON `nuxters` (`github_id`);--> statement-breakpoint
CREATE TABLE `nuxters_syncs` (
	`period` text PRIMARY KEY NOT NULL,
	`sha` text NOT NULL,
	`commit_sha` text NOT NULL,
	`count` integer NOT NULL,
	`synced_at` integer NOT NULL
);
