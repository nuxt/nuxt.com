export interface NuxterMergedPullRequests {
  feat: number
  fix: number
  docs: number
  chore: number
  all: number
}

/** The quality signals made in the core repositories, already included in the totals. */
export interface NuxterCoreContributions {
  mergedPullRequests: NuxterMergedPullRequests
  helpfulIssues: number
  helpfulComments: number
}

/** `all`, `30d`, `12m`, or a year from 2016 (`'2025'`). */
export type NuxtersPeriod = string

/** A contributor's stats over one period. */
export interface Nuxter {
  githubId: number
  username: string
  /** ISO date of the earliest counted contribution, `null` when unknown. */
  firstContributionAt: string | null
  rank: number
  score: number
  issues: number
  helpfulIssues: number
  comments: number
  helpfulComments: number
  reactions: number
  mergedPullRequests: NuxterMergedPullRequests
  /** The part made in nuxt/nuxt, nuxt/framework and nuxt/docs: it counts double in the score. */
  core: NuxterCoreContributions
}

/** A period line of a profile: "Last 30 days: #12 · 340 pts". */
export interface NuxterPeriodStats {
  period: NuxtersPeriod
  rank: number
  score: number
  mergedPullRequests: number
  issues: number
  comments: number
  reactions: number
}

/** /nuxters/[username]: all-time stats, plus every period the user contributed in. */
export interface NuxterProfile extends Nuxter {
  periods: NuxterPeriodStats[]
}

/** The light shape of the leaderboard. */
export interface NuxterSummary {
  githubId: number
  username: string
  rank: number
  score: number
}

export interface NuxtersPage {
  period: NuxtersPeriod
  /** The periods with data, in display order: rolling windows, all time, then years (newest first). */
  periods: NuxtersPeriod[]
  /** Contributors in the period. */
  total: number
  /** What they made in the period. Reactions are received, so they are not contributions. */
  totals: NuxtersTotals
  items: NuxterSummary[]
  syncedAt: string | null
}

export interface NuxtersTotals {
  /** Merged PRs + issues + comments */
  contributions: number
  mergedPullRequests: number
  issues: number
  comments: number
}

/** A hackathon whose participants unlock a badge and a Discord role. */
export interface NuxtersHackathon {
  /** Also the key of the Discord role ID in runtime config, so it must be env-var safe. */
  id: string
  name: string
  url: string
  participants: Array<{ githubId: string, username: string }>
}

export interface NuxterBadges {
  /** At least one merged PR, helpful issue or helpful comment. */
  nuxter: boolean
  moduleAuthor: boolean
  /** Hackathon ids. */
  hackathons: string[]
}

/** The signed-in user's view of /nuxters. */
export interface NuxterMe {
  username: string
  /** `null` when the user has no contributions on record yet. */
  nuxter: NuxterProfile | null
  badges: NuxterBadges
  discord: {
    /** `false` when the Discord env is not configured: the UI hides the Discord step. */
    enabled: boolean
    username: string | null
    roles: string[]
  }
}
