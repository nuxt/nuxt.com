import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core'
import type { NuxterSocialAccount } from '../../shared/types/nuxters'
import { TEMPLATE_CHECK_PHASES, type TemplateCheckPhaseTiming } from '../../shared/types/templates'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email'),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  username: text('username').notNull(),
  provider: text('provider', { enum: ['github'] }).notNull(),
  providerId: text('provider_id').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  ...timestamps
}, table => [uniqueIndex('users_provider_id_idx').on(table.provider, table.providerId)])

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rating: text('rating').notNull(),
  feedback: text('feedback'),
  path: text('path').notNull(),
  title: text('title').notNull(),
  stem: text('stem').notNull(),
  country: text('country').notNull(),
  fingerprint: text('fingerprint').notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull()
}, table => [uniqueIndex('path_fingerprint_idx').on(table.path, table.fingerprint)])

/**
 * Contribution stats per GitHub user and period, collected by github.com/nuxt/nuxters
 * and imported by the `syncNuxtersWorkflow`.
 */
export const nuxters = sqliteTable('nuxters', {
  // `all`, `30d`, `12m` or a year (`2016`…), one source file each
  period: text('period').notNull(),
  // Stable across GitHub username changes
  githubId: integer('github_id').notNull(),
  username: text('username').notNull(),
  // Profile URLs are case-insensitive. Not unique: a freed username can be taken by another account.
  usernameLower: text('username_lower').notNull(),
  rank: integer('rank').notNull(),
  score: integer('score').notNull(),
  issues: integer('issues').notNull().default(0),
  helpfulIssues: integer('helpful_issues').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  helpfulComments: integer('helpful_comments').notNull().default(0),
  reactions: integer('reactions').notNull().default(0),
  prFeat: integer('pr_feat').notNull().default(0),
  prFix: integer('pr_fix').notNull().default(0),
  prDocs: integer('pr_docs').notNull().default(0),
  prChore: integer('pr_chore').notNull().default(0),
  prAll: integer('pr_all').notNull().default(0),
  // The part of the quality signals made in the core repositories (nuxt/nuxt, nuxt/framework, nuxt/docs),
  // already included in the totals above. It counts double in the score.
  corePrFeat: integer('core_pr_feat').notNull().default(0),
  corePrFix: integer('core_pr_fix').notNull().default(0),
  corePrDocs: integer('core_pr_docs').notNull().default(0),
  corePrChore: integer('core_pr_chore').notNull().default(0),
  corePrAll: integer('core_pr_all').notNull().default(0),
  coreHelpfulIssues: integer('core_helpful_issues').notNull().default(0),
  coreHelpfulComments: integer('core_helpful_comments').notNull().default(0),
  // Earliest counted contribution, across all periods
  firstContributionAt: integer('first_contribution_at', { mode: 'timestamp' }),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull()
}, table => [
  primaryKey({ columns: [table.period, table.githubId] }),
  index('nuxters_period_rank_idx').on(table.period, table.rank),
  index('nuxters_period_username_lower_idx').on(table.period, table.usernameLower),
  index('nuxters_github_id_idx').on(table.githubId)
])

/**
 * Name, website, social accounts and country of the contributors who set any on GitHub, from `profiles.json`
 * of github.com/nuxt/nuxters. One row per user: links do not depend on the period.
 */
export const nuxterProfiles = sqliteTable('nuxter_profiles', {
  githubId: integer('github_id').primaryKey(),
  username: text('username').notNull(),
  name: text('name'),
  website: text('website'),
  socialAccounts: text('social_accounts', { mode: 'json' }).$type<NuxterSocialAccount[]>().notNull(),
  // ISO 3166-1 alpha-2 code, inferred by the collector from the free-form GitHub location
  country: text('country'),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull()
}, table => [index('nuxter_profiles_country_idx').on(table.country)])

/**
 * One row per imported file: the blob sha, to re-import only the files a commit changed.
 * Keyed by period, or `profiles` for `profiles.json`.
 */
export const nuxtersSyncs = sqliteTable('nuxters_syncs', {
  period: text('period').primaryKey(),
  // Git blob sha of the file
  sha: text('sha').notNull(),
  commitSha: text('commit_sha').notNull(),
  count: integer('count').notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull()
})

/**
 * The last check of each template by `checkTemplatesWorkflow`: install, build and, for templates that need no secrets, start in a browser.
 * `snapshotId` is the snapshot of the last passing check, the one live previews restore. A failing check keeps it, but the preview stays off until it passes again.
 */
export const templateChecks = sqliteTable('template_checks', {
  slug: text('slug').primaryKey(),
  // `queued` or `running` while a check is in progress, `idle` otherwise
  state: text('state', { enum: ['idle', 'queued', 'running'] }).notNull(),
  // What the running check is doing, and when each phase of the current or last check started
  phase: text('phase', { enum: TEMPLATE_CHECK_PHASES }),
  phases: text('phases', { mode: 'json' }).$type<TemplateCheckPhaseTiming[]>(),
  // Result of the last finished check, `null` before the first one
  status: text('status', { enum: ['passed', 'failed'] }),
  step: text('step', { enum: ['install', 'build', 'start'] }),
  nuxt: text('nuxt'),
  snapshotId: text('snapshot_id'),
  // Workflow run of the current or last check, the `template_check_runs` row it belongs to, and its sandbox
  runId: text('run_id'),
  batchId: text('batch_id'),
  sandbox: text('sandbox'),
  // End of the output: live while running, then of the failing step
  log: text('log'),
  seconds: integer('seconds'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  checkedAt: integer('checked_at', { mode: 'timestamp' }),
  passedAt: integer('passed_at', { mode: 'timestamp' })
})

/** One `checkTemplatesWorkflow` run: who started it and its shared Chromium sandbox. */
export const templateCheckRuns = sqliteTable('template_check_runs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  // Workflow run, set once it started
  runId: text('run_id'),
  state: text('state', { enum: ['running', 'finished'] }).notNull(),
  trigger: text('trigger', { enum: ['cron', 'task'] }).notNull(),
  startedBy: text('started_by'),
  total: integer('total').notNull(),
  browser: text('browser'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' })
}, table => [index('template_check_runs_started_at_idx').on(table.startedAt)])

/** The live preview each visitor holds. Reserved before its sandbox is created, so parallel starts can't run past the cap on previews. */
export const templatePreviews = sqliteTable('template_previews', {
  owner: text('owner').primaryKey(),
  // Name of the sandbox, chosen before it's created
  id: text('id').notNull(),
  // When the sandbox stops on its own, at the latest
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
}, table => [index('template_previews_expires_at_idx').on(table.expiresAt)])
