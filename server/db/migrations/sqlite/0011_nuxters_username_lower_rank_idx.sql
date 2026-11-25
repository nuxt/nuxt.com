DROP INDEX `nuxters_period_username_lower_idx`;--> statement-breakpoint
CREATE INDEX `nuxters_period_username_lower_rank_idx` ON `nuxters` (`period`,`username_lower`,`rank`);