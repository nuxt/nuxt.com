import type { Nuxter, NuxterMergedPullRequests, NuxterProfile, NuxtersHackathon, NuxtersPeriod } from '../types/nuxters'

/**
 * Where the contributor stats come from: committed nightly by the nuxt/nuxters CI,
 * one file per period in `public/`: `contributors.json` (all time), `contributors-30d.json`,
 * `contributors-12m.json` and `contributors-<year>.json`.
 */
export const NUXTERS_SOURCE = {
  repo: 'nuxt/nuxters',
  branch: 'main',
  dir: 'public'
} as const

export const NUXTERS_FIRST_YEAR = 2016

/**
 * The framework repository and its former homes (Nuxt 3 was built in nuxt/framework, the docs lived
 * in nuxt/docs). Merged PRs, helpful issues and helpful comments there count `NUXTERS_CORE_MULTIPLIER` times.
 * Keep in sync with `CORE_REPOS` in the nuxt/nuxters collector.
 */
export const NUXTERS_CORE_REPOS = ['nuxt/nuxt', 'nuxt/framework', 'nuxt/docs'] as const
export const NUXTERS_CORE_MULTIPLIER = 2
export const NUXTERS_DEFAULT_PERIOD: NuxtersPeriod = '12m'
const ROLLING_PERIODS = ['30d', '12m'] as const

/** Below this, the all-time file is most likely a broken collection run: refuse to import it. */
export const NUXTERS_MIN_ROWS = 1000

const PERIOD_RE = /^(?:all|30d|12m|\d{4})$/
const FILE_RE = /^contributors(?:-(30d|12m|\d{4}))?\.json$/

export function isNuxtersPeriod(value: unknown): value is NuxtersPeriod {
  return typeof value === 'string' && PERIOD_RE.test(value) && (!/^\d{4}$/.test(value) || Number(value) >= NUXTERS_FIRST_YEAR)
}

/** `contributors-30d.json` → `30d`, `contributors.json` → `all`, anything else → `null`. */
export function nuxtersPeriodFromFile(name: string): NuxtersPeriod | null {
  const match = FILE_RE.exec(name)
  if (!match) return null
  const period = match[1] ?? 'all'
  return isNuxtersPeriod(period) ? period : null
}

export function nuxtersPeriodFile(period: NuxtersPeriod): string {
  return period === 'all' ? 'contributors.json' : `contributors-${period}.json`
}

export function nuxtersPeriodLabel(period: NuxtersPeriod): string {
  if (period === '30d') return 'Last 30 days'
  if (period === '12m') return 'Last 12 months'
  if (period === 'all') return 'All time'
  return period
}

/** Rolling windows, all time, then years from the newest. */
export function sortNuxtersPeriods(periods: NuxtersPeriod[]): NuxtersPeriod[] {
  const order = (period: NuxtersPeriod) => {
    const rolling = ROLLING_PERIODS.indexOf(period as typeof ROLLING_PERIODS[number])
    if (rolling !== -1) return rolling
    if (period === 'all') return ROLLING_PERIODS.length
    return ROLLING_PERIODS.length + 1 + (9999 - Number(period))
  }
  return [...new Set(periods)].sort((a, b) => order(a) - order(b))
}

/** A profile's stats over `period` (all time for `all`), or `null` when the user did not contribute in it. */
export function nuxterForPeriod(profile: NuxterProfile, period: NuxtersPeriod): Nuxter | null {
  if (period === 'all') return profile
  const stats = profile.periods.find(row => row.period === period)
  if (!stats) return null
  const { period: _period, ...rest } = stats
  return { githubId: profile.githubId, username: profile.username, firstContributionAt: profile.firstContributionAt, ...rest }
}

/** Pinned to a commit: the branch URL is CDN-cached for 5 minutes and can serve the previous file. */
export function nuxtersSourceUrl(sha: string, file: string): string {
  return `https://raw.githubusercontent.com/${NUXTERS_SOURCE.repo}/${sha}/${NUXTERS_SOURCE.dir}/${file}`
}

interface PushPayload {
  ref?: string
  after?: string
  deleted?: boolean
  repository?: { full_name?: string }
  commits?: Array<{ added?: string[], modified?: string[] }>
}

/**
 * The commit to import for a GitHub push, or why the push is ignored.
 * The nuxt/nuxters CI commits `contributors.json` nightly; any other push is noise.
 */
export function nuxtersPushSha(payload: PushPayload): { sha: string } | { skipped: string } {
  if (payload.repository?.full_name !== NUXTERS_SOURCE.repo) return { skipped: 'other-repository' }
  if (payload.ref !== `refs/heads/${NUXTERS_SOURCE.branch}`) return { skipped: 'other-ref' }
  if (payload.deleted || !payload.after || /^0+$/.test(payload.after)) return { skipped: 'no-head-commit' }

  const prefix = `${NUXTERS_SOURCE.dir}/`
  const touched = (payload.commits ?? []).some(commit =>
    [...(commit.added ?? []), ...(commit.modified ?? [])].some(path =>
      path.startsWith(prefix) && nuxtersPeriodFromFile(path.slice(prefix.length)) !== null
    )
  )
  return touched ? { sha: payload.after } : { skipped: 'contributors-unchanged' }
}

/** A row of the `nuxters` table, without the period and the sync timestamp. */
export type NuxterRow = Omit<Nuxter, 'mergedPullRequests' | 'core'> & {
  usernameLower: string
  prFeat: number
  prFix: number
  prDocs: number
  prChore: number
  prAll: number
  corePrFeat: number
  corePrFix: number
  corePrDocs: number
  corePrChore: number
  corePrAll: number
  coreHelpfulIssues: number
  coreHelpfulComments: number
}

function count(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0
}

/**
 * Validate `contributors.json` and turn it into table rows, ranked by score.
 * Invalid entries are skipped, not fatal: one bad record must not block the import.
 */
export function parseNuxtersFile(data: unknown): NuxterRow[] {
  if (!Array.isArray(data)) {
    throw new TypeError('contributors.json must be an array')
  }

  const rows: NuxterRow[] = []
  const seen = new Set<number>()

  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>

    const githubId = Number(record.githubId)
    const username = typeof record.username === 'string' ? record.username.trim() : ''
    if (!Number.isSafeInteger(githubId) || githubId <= 0 || !username || seen.has(githubId)) continue
    seen.add(githubId)

    // Older files stored the merged PR total as a plain number.
    const prs = record.merged_pull_requests
    const merged = typeof prs === 'object' && prs
      ? prs as Partial<NuxterMergedPullRequests>
      : { all: count(prs) }

    const first = typeof record.first_contribution_at === 'string' ? new Date(record.first_contribution_at) : null
    // Files from before the core bonus have no `core` object: no bonus.
    const core = (typeof record.core === 'object' && record.core ? record.core : {}) as {
      merged_pull_requests?: Partial<NuxterMergedPullRequests>
      helpful_issues?: unknown
      helpful_comments?: unknown
    }
    const coreMerged = core.merged_pull_requests ?? {}

    rows.push({
      githubId,
      username,
      usernameLower: username.toLowerCase(),
      firstContributionAt: first && !Number.isNaN(first.getTime()) ? first.toISOString() : null,
      rank: 0,
      score: count(record.score),
      issues: count(record.issues),
      helpfulIssues: count(record.helpful_issues),
      comments: count(record.comments),
      helpfulComments: count(record.helpful_comments),
      reactions: count(record.reactions),
      prFeat: count(merged.feat),
      prFix: count(merged.fix),
      prDocs: count(merged.docs),
      prChore: count(merged.chore),
      prAll: count(merged.all),
      corePrFeat: count(coreMerged.feat),
      corePrFix: count(coreMerged.fix),
      corePrDocs: count(coreMerged.docs),
      corePrChore: count(coreMerged.chore),
      corePrAll: count(coreMerged.all),
      coreHelpfulIssues: count(core.helpful_issues),
      coreHelpfulComments: count(core.helpful_comments)
    })
  }

  // Same order as the collector: score, then username.
  rows.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
  rows.forEach((row, index) => {
    row.rank = index + 1
  })

  return rows
}

export function rowToNuxter(row: Omit<NuxterRow, 'usernameLower' | 'firstContributionAt'> & { firstContributionAt: Date | string | null }): Nuxter {
  const first = row.firstContributionAt
  return {
    githubId: row.githubId,
    username: row.username,
    firstContributionAt: first instanceof Date ? first.toISOString() : first,
    rank: row.rank,
    score: row.score,
    issues: row.issues,
    helpfulIssues: row.helpfulIssues,
    comments: row.comments,
    helpfulComments: row.helpfulComments,
    reactions: row.reactions,
    mergedPullRequests: {
      feat: row.prFeat,
      fix: row.prFix,
      docs: row.prDocs,
      chore: row.prChore,
      all: row.prAll
    },
    core: {
      mergedPullRequests: {
        feat: row.corePrFeat,
        fix: row.corePrFix,
        docs: row.corePrDocs,
        chore: row.corePrChore,
        all: row.corePrAll
      },
      helpfulIssues: row.coreHelpfulIssues,
      helpfulComments: row.coreHelpfulComments
    }
  }
}

export interface NuxterScoreRow {
  key: string
  label: string
  icon: string
  multiplier: number
  amount: number
  total: number
  /** Extra points for the core repositories, on top of the base rows. */
  bonus: boolean
}

/**
 * How the collector weighs each contribution type (see nuxt/nuxters `computeScore`).
 * Base rows first, then the core bonus rows; each group sorted by total. The totals add up to the score
 * (the collector rounds the sum once).
 */
export function nuxterScoreBreakdown(nuxter: Nuxter): NuxterScoreRow[] {
  const prs = nuxter.mergedPullRequests
  const core = nuxter.core
  const extra = NUXTERS_CORE_MULTIPLIER - 1
  const base: Array<Omit<NuxterScoreRow, 'total' | 'bonus'>> = [
    { key: 'feat', label: 'Feature PRs', icon: 'i-lucide-rocket', multiplier: 7, amount: prs.feat },
    { key: 'fix', label: 'Fix PRs', icon: 'i-lucide-wrench', multiplier: 5, amount: prs.fix },
    { key: 'docs', label: 'Docs PRs', icon: 'i-lucide-book-open', multiplier: 4, amount: prs.docs },
    { key: 'chore', label: 'Chore PRs', icon: 'i-lucide-brush-cleaning', multiplier: 3, amount: prs.chore },
    { key: 'helpfulIssues', label: 'Helpful issues', icon: 'i-lucide-lightbulb', multiplier: 3, amount: nuxter.helpfulIssues },
    { key: 'helpfulComments', label: 'Helpful comments', icon: 'i-lucide-message-circle-heart', multiplier: 2, amount: nuxter.helpfulComments },
    { key: 'issues', label: 'Issues', icon: 'i-lucide-circle-dot', multiplier: 1, amount: nuxter.issues },
    { key: 'comments', label: 'Comments', icon: 'i-lucide-message-circle', multiplier: 0.5, amount: nuxter.comments },
    { key: 'reactions', label: 'Reactions', icon: 'i-lucide-smile-plus', multiplier: 0.1, amount: nuxter.reactions }
  ]
  const bonus: Array<Omit<NuxterScoreRow, 'total' | 'bonus'>> = [
    { key: 'coreFeat', label: 'Core feature PRs', icon: 'i-lucide-rocket', multiplier: 7 * extra, amount: core.mergedPullRequests.feat },
    { key: 'coreFix', label: 'Core fix PRs', icon: 'i-lucide-wrench', multiplier: 5 * extra, amount: core.mergedPullRequests.fix },
    { key: 'coreDocs', label: 'Core docs PRs', icon: 'i-lucide-book-open', multiplier: 4 * extra, amount: core.mergedPullRequests.docs },
    { key: 'coreChore', label: 'Core chore PRs', icon: 'i-lucide-brush-cleaning', multiplier: 3 * extra, amount: core.mergedPullRequests.chore },
    { key: 'coreHelpfulIssues', label: 'Core helpful issues', icon: 'i-lucide-lightbulb', multiplier: 3 * extra, amount: core.helpfulIssues },
    { key: 'coreHelpfulComments', label: 'Core helpful comments', icon: 'i-lucide-message-circle-heart', multiplier: 2 * extra, amount: core.helpfulComments }
  ]

  const withTotals = (rows: typeof base, isBonus: boolean) => rows
    .map(row => ({ ...row, bonus: isBonus, total: Math.round(row.amount * row.multiplier * 10) / 10 }))
    .sort((a, b) => b.total - a.total)

  return [...withTotals(base, false), ...withTotals(bonus, true).filter(row => row.amount > 0)]
}

/** The Discord `nuxter` role needs one merged PR, one helpful issue or one helpful comment. */
export function canUnlockNuxterRole(nuxter: Nuxter | null | undefined): boolean {
  if (!nuxter) return false
  return nuxter.mergedPullRequests.all + nuxter.helpfulIssues + nuxter.helpfulComments > 0
}

export const NUXTERS_HACKATHONS: NuxtersHackathon[] = [
  {
    id: 'nuxtathon1',
    name: 'Nuxtathon #1',
    url: 'https://github.com/nuxt/nuxt/issues/35561',
    participants: [
      { githubId: '10813063', username: 'Flo0806' },
      { githubId: '89837724', username: 'Norbiros' },
      { githubId: '25607142', username: 'Mateleo' },
      { githubId: '37191683', username: 'OrbisK' },
      { githubId: '112722215', username: 'cernymatej' },
      { githubId: '245008322', username: 'stephanelgrg' },
      { githubId: '7257092', username: 'luc122c' },
      { githubId: '1107521', username: 'hacknug' },
      { githubId: '59548500', username: 'KealanAU' },
      { githubId: '5794325', username: 'yschroe' },
      { githubId: '21310742', username: 'MirkoJa' },
      { githubId: '24661232', username: 'Jorgagu' },
      { githubId: '48835293', username: 'DamianGlowala' },
      { githubId: '114825598', username: 'DarlanPrado' },
      { githubId: '2138260', username: 'Ibochkarev' },
      { githubId: '50132270', username: 'abaza738' },
      { githubId: '18102267', username: 'oritwoen' },
      { githubId: '22072217', username: 'onmax' },
      { githubId: '6538827', username: 'bdbch' },
      { githubId: '34019878', username: 'martinszeltins' },
      { githubId: '87276663', username: 'lorypelli' },
      { githubId: '22201189', username: 'lutejka' },
      { githubId: '58456495', username: 'chairulakmal' },
      { githubId: '35817344', username: 'chstappert' },
      { githubId: '7356077', username: 'connerblanton' },
      { githubId: '16652879', username: 'DevilTea' },
      { githubId: '85992002', username: 'KazariEX' },
      { githubId: '31246997', username: 'Niki2k1' },
      { githubId: '27751688', username: 'oneminch' },
      { githubId: '1766126', username: 'sumerokr' },
      { githubId: '43837308', username: 'wattanx' },
      { githubId: '35223685', username: 'yamachi4416' },
      { githubId: '28706372', username: 'danielroe' },
      { githubId: '5326365', username: 'harlan-zw' },
      { githubId: '640208', username: 'TheAlexLichter' },
      { githubId: '63512348', username: 'huang-julien' },
      { githubId: '1377702', username: 'serhalp' }
    ]
  }
]

export function nuxterHackathons(githubId: string | number | undefined | null): NuxtersHackathon[] {
  if (!githubId) return []
  const id = String(githubId)
  return NUXTERS_HACKATHONS.filter(hackathon => hackathon.participants.some(p => p.githubId === id))
}
