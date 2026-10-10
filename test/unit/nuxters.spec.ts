import { describe, expect, it } from 'vitest'
import {
  canUnlockNuxterRole,
  isNuxtersPeriod,
  nuxterHackathons,
  nuxterScoreBreakdown,
  nuxtersPeriodFile,
  nuxtersPeriodFromFile,
  nuxtersPeriodLabel,
  nuxtersPushSha,
  nuxtersSourceUrl,
  sortNuxtersPeriods,
  parseNuxtersFile,
  rowToNuxter
} from '../../shared/utils/nuxters'

const SHA = '8fe4e110dfc34b8c2b975100a65323b8d0313ea9'

function record(overrides: Record<string, unknown> = {}) {
  return {
    username: 'atinux',
    githubId: '904724',
    issues: 3,
    merged_pull_requests: { docs: 1, chore: 2, feat: 3, fix: 4, all: 10 },
    helpful_issues: 2,
    comments: 8,
    helpful_comments: 1,
    reactions: 20,
    score: 100,
    first_contribution_at: '2017-03-04T05:06:07.000Z',
    core: {
      merged_pull_requests: { docs: 1, chore: 0, feat: 2, fix: 1, all: 4 },
      helpful_issues: 1,
      helpful_comments: 0
    },
    ...overrides
  }
}

describe('parseNuxtersFile', () => {
  it('maps the collector format to table rows', () => {
    const [row] = parseNuxtersFile([record()])
    expect(row).toEqual({
      githubId: 904724,
      username: 'atinux',
      usernameLower: 'atinux',
      firstContributionAt: '2017-03-04T05:06:07.000Z',
      rank: 1,
      score: 100,
      issues: 3,
      helpfulIssues: 2,
      comments: 8,
      helpfulComments: 1,
      reactions: 20,
      prFeat: 3,
      prFix: 4,
      prDocs: 1,
      prChore: 2,
      prAll: 10,
      corePrFeat: 2,
      corePrFix: 1,
      corePrDocs: 1,
      corePrChore: 0,
      corePrAll: 4,
      coreHelpfulIssues: 1,
      coreHelpfulComments: 0
    })
  })

  it('reads files from before the core bonus as no core contributions', () => {
    const [row] = parseNuxtersFile([record({ core: undefined })])
    expect(row).toMatchObject({ corePrAll: 0, corePrFeat: 0, coreHelpfulIssues: 0, coreHelpfulComments: 0 })
  })

  it('ranks by score, then username, whatever the file order', () => {
    const rows = parseNuxtersFile([
      record({ username: 'b', githubId: '2', score: 5 }),
      record({ username: 'c', githubId: '3', score: 9 }),
      record({ username: 'a', githubId: '1', score: 5 })
    ])
    expect(rows.map(row => [row.username, row.rank])).toEqual([['c', 1], ['a', 2], ['b', 3]])
  })

  it('reads the legacy number format of merged_pull_requests', () => {
    const [row] = parseNuxtersFile([record({ merged_pull_requests: 7 })])
    expect(row).toMatchObject({ prAll: 7, prFeat: 0, prFix: 0, prDocs: 0, prChore: 0 })
  })

  it('skips invalid and duplicate entries instead of failing the import', () => {
    const rows = parseNuxtersFile([
      null,
      'nope',
      record({ githubId: '' }),
      record({ githubId: 'abc' }),
      record({ username: '  ' }),
      record({ username: 'first', githubId: '42' }),
      record({ username: 'duplicate', githubId: '42' })
    ])
    expect(rows.map(row => row.username)).toEqual(['first'])
  })

  it('clamps negative and non-numeric counts to 0', () => {
    const [row] = parseNuxtersFile([record({ issues: -4, comments: 'many', reactions: 2.6 })])
    expect(row).toMatchObject({ issues: 0, comments: 0, reactions: 3 })
  })

  it('reads a missing or invalid first contribution date as null', () => {
    const rows = parseNuxtersFile([
      record({ githubId: '1', first_contribution_at: null }),
      record({ githubId: '2', first_contribution_at: 'not a date' }),
      record({ githubId: '3', first_contribution_at: undefined })
    ])
    expect(rows.map(row => row.firstContributionAt)).toEqual([null, null, null])
  })

  it('rejects a file that is not an array', () => {
    expect(() => parseNuxtersFile({ contributors: [] })).toThrow(TypeError)
  })
})

describe('nuxtersPushSha', () => {
  const push = (overrides: Record<string, unknown> = {}) => ({
    ref: 'refs/heads/main',
    after: SHA,
    repository: { full_name: 'nuxt/nuxters' },
    commits: [{ added: [], modified: ['public/contributors.json'] }],
    ...overrides
  })

  it('returns the head commit when the CI changed a period file', () => {
    expect(nuxtersPushSha(push())).toEqual({ sha: SHA })
    expect(nuxtersPushSha(push({ commits: [{ modified: ['public/contributors-30d.json'] }] }))).toEqual({ sha: SHA })
    // The first file of a new year is added, not modified
    expect(nuxtersPushSha(push({ commits: [{ added: ['public/contributors-2027.json'] }] }))).toEqual({ sha: SHA })
  })

  it('ignores pushes that do not change the data', () => {
    expect(nuxtersPushSha(push({ commits: [{ modified: ['README.md'] }] }))).toEqual({ skipped: 'contributors-unchanged' })
    expect(nuxtersPushSha(push({ commits: [{ modified: ['public/contributors-old.json', 'scripts/contributors.json'] }] }))).toEqual({ skipped: 'contributors-unchanged' })
    expect(nuxtersPushSha(push({ commits: [] }))).toEqual({ skipped: 'contributors-unchanged' })
  })

  it('ignores other repositories, branches and branch deletions', () => {
    expect(nuxtersPushSha(push({ repository: { full_name: 'nuxt/nuxt' } }))).toEqual({ skipped: 'other-repository' })
    expect(nuxtersPushSha(push({ ref: 'refs/heads/renovate/eslint' }))).toEqual({ skipped: 'other-ref' })
    expect(nuxtersPushSha(push({ deleted: true }))).toEqual({ skipped: 'no-head-commit' })
    expect(nuxtersPushSha(push({ after: '0'.repeat(40) }))).toEqual({ skipped: 'no-head-commit' })
  })
})

describe('nuxtersSourceUrl', () => {
  it('pins the raw file to a commit', () => {
    expect(nuxtersSourceUrl(SHA, 'contributors-12m.json')).toBe(`https://raw.githubusercontent.com/nuxt/nuxters/${SHA}/public/contributors-12m.json`)
  })
})

describe('periods', () => {
  it('accepts all, the rolling windows and years from 2016', () => {
    for (const period of ['all', '30d', '12m', '2016', '2025']) {
      expect(isNuxtersPeriod(period)).toBe(true)
    }
    for (const period of ['', '7d', '2015', '20255', 'ALL', 2025, undefined]) {
      expect(isNuxtersPeriod(period)).toBe(false)
    }
  })

  it('maps file names to periods and back', () => {
    expect(nuxtersPeriodFromFile('contributors.json')).toBe('all')
    expect(nuxtersPeriodFromFile('contributors-30d.json')).toBe('30d')
    expect(nuxtersPeriodFromFile('contributors-2019.json')).toBe('2019')
    expect(nuxtersPeriodFromFile('contributors-2015.json')).toBeNull()
    expect(nuxtersPeriodFromFile('contributors-6m.json')).toBeNull()
    expect(nuxtersPeriodFromFile('icon.png')).toBeNull()
    for (const period of ['all', '30d', '12m', '2024']) {
      expect(nuxtersPeriodFromFile(nuxtersPeriodFile(period))).toBe(period)
    }
  })

  it('orders rolling windows, all time, then years from the newest', () => {
    expect(sortNuxtersPeriods(['2017', 'all', '2025', '12m', '30d', '2020', '12m'])).toEqual(['30d', '12m', 'all', '2025', '2020', '2017'])
  })

  it('labels each period', () => {
    expect(['30d', '12m', 'all', '2024'].map(nuxtersPeriodLabel)).toEqual(['Last 30 days', 'Last 12 months', 'All time', '2024'])
  })
})

describe('nuxter scoring', () => {
  const nuxter = rowToNuxter(parseNuxtersFile([record()])[0]!)

  it('weighs each contribution type like the collector', () => {
    const totals = Object.fromEntries(nuxterScoreBreakdown(nuxter).map(row => [row.key, row.total]))
    expect(totals).toEqual({
      feat: 21,
      fix: 20,
      docs: 4,
      chore: 6,
      helpfulIssues: 6,
      helpfulComments: 2,
      issues: 3,
      comments: 4,
      reactions: 2,
      // Core bonus: the core part counts once more. Rows without core contributions are left out.
      coreFeat: 14,
      coreFix: 5,
      coreDocs: 4,
      coreHelpfulIssues: 3
    })
  })

  it('adds up to the collector score', () => {
    // nuxt/nuxters `computeScore`: base points + the core quality points once more, rounded once.
    const n = nuxter
    const quality = (prs: typeof n.mergedPullRequests, helpfulIssues: number, helpfulComments: number) =>
      prs.feat * 7 + prs.fix * 5 + prs.docs * 4 + prs.chore * 3 + helpfulIssues * 3 + helpfulComments * 2
    const collectorScore = Math.round(
      quality(n.mergedPullRequests, n.helpfulIssues, n.helpfulComments)
      + n.issues + n.comments * 0.5 + n.reactions * 0.1
      + quality(n.core.mergedPullRequests, n.core.helpfulIssues, n.core.helpfulComments)
    )
    const sum = nuxterScoreBreakdown(n).reduce((total, row) => total + row.total, 0)
    expect(Math.round(sum)).toBe(collectorScore)
  })

  it('lists base rows first, then bonus rows, each sorted by total', () => {
    const rows = nuxterScoreBreakdown(nuxter)
    const firstBonus = rows.findIndex(row => row.bonus)
    expect(rows.slice(firstBonus).every(row => row.bonus)).toBe(true)
    for (const group of [rows.slice(0, firstBonus), rows.slice(firstBonus)]) {
      const totals = group.map(row => row.total)
      expect(totals).toEqual([...totals].sort((a, b) => b - a))
    }
  })

  it('unlocks the Nuxter role with one merged PR, helpful issue or helpful comment', () => {
    const none = { ...nuxter, helpfulIssues: 0, helpfulComments: 0, mergedPullRequests: { ...nuxter.mergedPullRequests, all: 0 } }
    expect(canUnlockNuxterRole(nuxter)).toBe(true)
    expect(canUnlockNuxterRole(none)).toBe(false)
    expect(canUnlockNuxterRole({ ...none, helpfulComments: 1 })).toBe(true)
    expect(canUnlockNuxterRole(null)).toBe(false)
  })
})

describe('nuxterHackathons', () => {
  it('matches participants by GitHub id, as a string or a number', () => {
    expect(nuxterHackathons('28706372').map(hackathon => hackathon.id)).toEqual(['nuxtathon1'])
    expect(nuxterHackathons(28706372).map(hackathon => hackathon.id)).toEqual(['nuxtathon1'])
    expect(nuxterHackathons('1')).toEqual([])
    expect(nuxterHackathons(undefined)).toEqual([])
  })
})
