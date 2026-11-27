import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core'
import type { NuxterSocialAccount } from '../../shared/types/nuxters'
import { TEMPLATE_CHECK_PHASES, type TemplateCheckPhaseTiming } from '../utils/templates/check-report'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}

/**
 * Better Auth's `user` model (see `server/utils/auth.ts`). `email` stays nullable for accounts created
 * before Better Auth; it is filled in at their next sign-in.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  username: text('username').notNull(),
  provider: text('provider', { enum: ['github'] }).notNull(),
  providerId: text('provider_id').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  ...timestamps,
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).$onUpdate(() => new Date())
}, table => [uniqueIndex('users_provider_id_idx').on(table.provider, table.providerId)])

// Better Auth's `session`, `account` and `verification` models. The `auth_` prefix keeps them clear of
// tables other branches have left in the shared Preview database.
export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  ...timestamps,
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date())
}, table => [index('auth_sessions_user_id_idx').on(table.userId)])

export const authAccounts = sqliteTable('auth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date())
}, table => [
  uniqueIndex('auth_accounts_provider_account_idx').on(table.providerId, table.accountId),
  index('auth_accounts_user_id_idx').on(table.userId)
])

export const authVerifications = sqliteTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ...timestamps,
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date())
}, table => [index('auth_verifications_identifier_idx').on(table.identifier)])

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
  // Segments of the docs translations (nuxt/translations), not part of the core bonus
  translationsEdited: integer('translations_edited').notNull().default(0),
  translationsVerified: integer('translations_verified').notNull().default(0),
  translationsRejected: integer('translations_rejected').notNull().default(0),
  // Earliest counted contribution, across all periods
  firstContributionAt: integer('first_contribution_at', { mode: 'timestamp' }),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull()
}, table => [
  primaryKey({ columns: [table.period, table.githubId] }),
  index('nuxters_period_rank_idx').on(table.period, table.rank),
  // `rank` too: a profile lookup (`username_lower = ? order by rank limit 1`) reads one row. Without it,
  // SQLite walks the leaderboard by rank until it meets the username (28k rows for the last one).
  index('nuxters_period_username_lower_rank_idx').on(table.period, table.usernameLower, table.rank),
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
  trigger: text('trigger', { enum: ['cron', 'task', 'mcp', 'admin'] }).notNull(),
  startedBy: text('started_by'),
  total: integer('total').notNull(),
  browser: text('browser'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' })
}, table => [index('template_check_runs_started_at_idx').on(table.startedAt)])

/** One row per preview sandbox, reserved before it's created, so parallel starts can't run past the cap on previews. A visitor's latest row is the preview it holds. */
export const templatePreviews = sqliteTable('template_previews', {
  // Name of the sandbox, chosen before it's created
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  reservedAt: integer('reserved_at', { mode: 'timestamp_ms' }).notNull(),
  // When the sandbox stops on its own, at the latest
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
}, table => [
  index('template_previews_owner_idx').on(table.owner),
  index('template_previews_expires_at_idx').on(table.expiresAt)
])

/** Translation saves and the segments they changed, per user per hour (hours since the epoch). */
export const l10nSaves = sqliteTable('l10n_saves', {
  userId: text('user_id').notNull(),
  hour: integer('hour').notNull(),
  saves: integer('saves').notNull(),
  changes: integer('changes').notNull()
}, table => [
  primaryKey({ columns: [table.userId, table.hour] }),
  index('l10n_saves_hour_idx').on(table.hour)
])

// Better Auth's OAuth provider for the admin MCP (`mcp()` and `cimd()` in `server/utils/auth.ts`) and the
// `jwt` plugin's signing keys. Same `auth_` prefix as the tables above.
export const authJwks = sqliteTable('auth_jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  alg: text('alg'),
  crv: text('crv')
})

export const authOauthClients = sqliteTable(
  'auth_oauth_clients',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id').notNull().unique(),
    clientSecret: text('client_secret'),
    clientDiscoveryId: text('client_discovery_id'),
    disabled: integer('disabled', { mode: 'boolean' }).default(false),
    skipConsent: integer('skip_consent', { mode: 'boolean' }),
    enableEndSession: integer('enable_end_session', { mode: 'boolean' }),
    subjectType: text('subject_type'),
    scopes: text('scopes', { mode: 'json' }),
    clientCredentialsScopes: text('client_credentials_scopes', {
      mode: 'json'
    }).default([]),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
    name: text('name'),
    uri: text('uri'),
    icon: text('icon'),
    contacts: text('contacts', { mode: 'json' }),
    tos: text('tos'),
    policy: text('policy'),
    softwareId: text('software_id'),
    softwareVersion: text('software_version'),
    softwareStatement: text('software_statement'),
    redirectUris: text('redirect_uris', { mode: 'json' }).notNull(),
    postLogoutRedirectUris: text('post_logout_redirect_uris', { mode: 'json' }),
    backchannelLogoutUri: text('backchannel_logout_uri'),
    backchannelLogoutSessionRequired: integer(
      'backchannel_logout_session_required',
      { mode: 'boolean' }
    ),
    tokenEndpointAuthMethod: text('token_endpoint_auth_method'),
    applicationType: text('application_type'),
    jwks: text('jwks'),
    jwksUri: text('jwks_uri'),
    grantTypes: text('grant_types', { mode: 'json' }),
    responseTypes: text('response_types', { mode: 'json' }),
    requirePKCE: integer('require_pkce', { mode: 'boolean' }),
    dpopBoundAccessTokens: integer('dpop_bound_access_tokens', {
      mode: 'boolean'
    }).default(false),
    referenceId: text('reference_id'),
    metadata: text('metadata', { mode: 'json' })
  },
  table => [index('auth_oauth_clients_user_id_idx').on(table.userId)]
)

export const authOauthResources = sqliteTable('auth_oauth_resources', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull().unique(),
  name: text('name').notNull(),
  accessTokenTtl: integer('access_token_ttl'),
  refreshTokenTtl: integer('refresh_token_ttl'),
  signingAlgorithm: text('signing_algorithm'),
  signingKeyId: text('signing_key_id'),
  allowedScopes: text('allowed_scopes', { mode: 'json' }),
  customClaims: text('custom_claims', { mode: 'json' }),
  dpopBoundAccessTokensRequired: integer('dpop_bound_access_tokens_required', {
    mode: 'boolean'
  }).default(false),
  disabled: integer('disabled', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
  policyVersion: integer('policy_version').default(1),
  metadata: text('metadata', { mode: 'json' })
})

export const authOauthClientResources = sqliteTable(
  'auth_oauth_client_resources',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id')
      .notNull()
      .references(() => authOauthClients.clientId, { onDelete: 'cascade' }),
    resourceId: text('resource_id')
      .notNull()
      .references(() => authOauthResources.identifier, { onDelete: 'cascade' }),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
  },
  table => [
    uniqueIndex('auth_oauth_client_resources_client_id_resource_id_uidx').on(
      table.clientId,
      table.resourceId
    ),
    index('auth_oauth_client_resources_client_id_idx').on(table.clientId),
    index('auth_oauth_client_resources_resource_id_idx').on(table.resourceId)
  ]
)

export const authOauthRefreshTokens = sqliteTable(
  'auth_oauth_refresh_tokens',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    clientId: text('client_id')
      .notNull()
      .references(() => authOauthClients.clientId, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => authSessions.id, {
      onDelete: 'set null'
    }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    authorizationCodeId: text('authorization_code_id'),
    resources: text('resources', { mode: 'json' }),
    requestedUserInfoClaims: text('requested_user_info_claims', {
      mode: 'json'
    }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    revoked: integer('revoked', { mode: 'timestamp_ms' }),
    rotatedAt: integer('rotated_at', { mode: 'timestamp_ms' }),
    rotationReplayResponse: text('rotation_replay_response'),
    rotationReplayExpiresAt: integer('rotation_replay_expires_at', {
      mode: 'timestamp_ms'
    }),
    authTime: integer('auth_time', { mode: 'timestamp_ms' }),
    confirmation: text('confirmation', { mode: 'json' }),
    scopes: text('scopes', { mode: 'json' }).notNull()
  },
  table => [
    index('auth_oauth_refresh_tokens_client_id_idx').on(table.clientId),
    index('auth_oauth_refresh_tokens_session_id_idx').on(table.sessionId),
    index('auth_oauth_refresh_tokens_user_id_idx').on(table.userId),
    index('auth_oauth_refresh_tokens_authorization_code_id_idx').on(
      table.authorizationCodeId
    )
  ]
)

export const authOauthAccessTokens = sqliteTable(
  'auth_oauth_access_tokens',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    clientId: text('client_id')
      .notNull()
      .references(() => authOauthClients.clientId, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => authSessions.id, {
      onDelete: 'set null'
    }),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    authorizationCodeId: text('authorization_code_id'),
    resources: text('resources', { mode: 'json' }),
    requestedUserInfoClaims: text('requested_user_info_claims', {
      mode: 'json'
    }),
    refreshId: text('refresh_id').references(() => authOauthRefreshTokens.id, {
      onDelete: 'cascade'
    }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    revoked: integer('revoked', { mode: 'timestamp_ms' }),
    confirmation: text('confirmation', { mode: 'json' }),
    scopes: text('scopes', { mode: 'json' }).notNull()
  },
  table => [
    index('auth_oauth_access_tokens_client_id_idx').on(table.clientId),
    index('auth_oauth_access_tokens_session_id_idx').on(table.sessionId),
    index('auth_oauth_access_tokens_user_id_idx').on(table.userId),
    index('auth_oauth_access_tokens_authorization_code_id_idx').on(
      table.authorizationCodeId
    ),
    index('auth_oauth_access_tokens_refresh_id_idx').on(table.refreshId)
  ]
)

export const authOauthConsents = sqliteTable(
  'auth_oauth_consents',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id')
      .notNull()
      .references(() => authOauthClients.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    resources: text('resources', { mode: 'json' }),
    requestedUserInfoClaims: text('requested_user_info_claims', {
      mode: 'json'
    }),
    scopes: text('scopes', { mode: 'json' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
  },
  table => [
    index('auth_oauth_consents_client_id_idx').on(table.clientId),
    index('auth_oauth_consents_user_id_idx').on(table.userId)
  ]
)

export const authOauthClientAssertions = sqliteTable(
  'auth_oauth_client_assertions',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
  }
)
