import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core'

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

/** One row per period file: the imported blob, to re-import only the files a commit changed. */
export const nuxtersSyncs = sqliteTable('nuxters_syncs', {
  period: text('period').primaryKey(),
  // Git blob sha of the file
  sha: text('sha').notNull(),
  commitSha: text('commit_sha').notNull(),
  count: integer('count').notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull()
})
