CREATE TABLE `nuxter_profiles` (
	`github_id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`website` text,
	`social_accounts` text NOT NULL,
	`synced_at` integer NOT NULL
);
