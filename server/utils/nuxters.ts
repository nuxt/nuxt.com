import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { H3Event } from 'h3'
import type { BatchItem } from 'drizzle-orm/batch'
import { and, asc, count, eq, inArray, sum } from 'drizzle-orm'
import type { NuxterBadges, NuxterProfile, NuxtersPage, NuxtersPeriod, NuxterSummary } from '#shared/types'
import {
  NUXTERS_MIN_ROWS,
  NUXTERS_SOURCE,
  canUnlockNuxterRole,
  nuxterHackathons,
  nuxtersPeriodFromFile,
  nuxtersSourceUrl,
  parseNuxtersFile,
  rowToNuxter,
  sortNuxtersPeriods
} from '#shared/utils/nuxters'

/** 18 columns per row: stays well under SQLite's 32,766 bound-variable limit. */
const INSERT_CHUNK_SIZE = 500

type NuxterDbRow = typeof schema.nuxters.$inferSelect

function toProfile(rows: NuxterDbRow[]): NuxterProfile | null {
  const allTime = rows.find(row => row.period === 'all')
  if (!allTime) return null

  const byPeriod = new Map(rows.map(row => [row.period, row]))
  return {
    ...rowToNuxter(allTime),
    periods: sortNuxtersPeriods(rows.map(row => row.period).filter(period => period !== 'all')).map((period) => {
      const row = byPeriod.get(period)!
      return {
        period,
        rank: row.rank,
        score: row.score,
        mergedPullRequests: row.prAll,
        issues: row.issues,
        comments: row.comments,
        reactions: row.reactions
      }
    })
  }
}

export const nuxters = {
  /** All-time profile with every period, by username (case-insensitive). On a clash (renamed account), the best ranked wins. */
  async get(username: string): Promise<NuxterProfile | null> {
    const [allTime] = await db.select({ githubId: schema.nuxters.githubId }).from(schema.nuxters)
      .where(and(eq(schema.nuxters.period, 'all'), eq(schema.nuxters.usernameLower, username.toLowerCase())))
      .orderBy(asc(schema.nuxters.rank))
      .limit(1)
    return allTime ? nuxters.getByGithubId(allTime.githubId) : null
  },

  async getByGithubId(githubId: number | string): Promise<NuxterProfile | null> {
    const id = Number(githubId)
    if (!Number.isSafeInteger(id)) return null
    const rows = await db.select().from(schema.nuxters).where(eq(schema.nuxters.githubId, id))
    return toProfile(rows)
  },

  async list({ period = 'all', offset = 0, limit = 100 }: { period?: NuxtersPeriod, offset?: number, limit?: number } = {}): Promise<NuxtersPage> {
    const [items, [totals], syncs] = await Promise.all([
      db.select({
        githubId: schema.nuxters.githubId,
        username: schema.nuxters.username,
        rank: schema.nuxters.rank,
        score: schema.nuxters.score
      }).from(schema.nuxters)
        .where(eq(schema.nuxters.period, period))
        .orderBy(asc(schema.nuxters.rank))
        .limit(limit)
        .offset(offset),
      // One indexed scan of the period: contributors and what they made.
      db.select({
        contributors: count(),
        mergedPullRequests: sum(schema.nuxters.prAll),
        issues: sum(schema.nuxters.issues),
        comments: sum(schema.nuxters.comments)
      }).from(schema.nuxters).where(eq(schema.nuxters.period, period)),
      nuxters.syncs()
    ])
    // SQLite `SUM` is `NULL` on an empty period, and drizzle returns it as a string.
    const mergedPullRequests = Number(totals?.mergedPullRequests ?? 0)
    const issues = Number(totals?.issues ?? 0)
    const comments = Number(totals?.comments ?? 0)
    return {
      period,
      periods: sortNuxtersPeriods(syncs.filter(sync => sync.count > 0).map(sync => sync.period)),
      total: totals?.contributors ?? 0,
      totals: {
        contributions: mergedPullRequests + issues + comments,
        mergedPullRequests,
        issues,
        comments
      },
      items: items satisfies NuxterSummary[],
      syncedAt: syncs.find(sync => sync.period === period)?.syncedAt.toISOString() ?? null
    }
  },

  /** All-time scores by lowercased username, for the team pages. */
  async scores(usernames: string[]): Promise<Map<string, number>> {
    if (!usernames.length) return new Map()
    const rows = await db.select({ usernameLower: schema.nuxters.usernameLower, score: schema.nuxters.score })
      .from(schema.nuxters)
      .where(and(
        eq(schema.nuxters.period, 'all'),
        inArray(schema.nuxters.usernameLower, usernames.map(username => username.toLowerCase()))
      ))
    return new Map(rows.map(row => [row.usernameLower, row.score]))
  },

  /** The imported files, one per period. */
  async syncs() {
    return db.select().from(schema.nuxtersSyncs)
  },

  /** Badges are earned on all-time stats. */
  async badges(event: H3Event, user: { username: string, providerId: string }, nuxter: NuxterProfile | null): Promise<NuxterBadges> {
    const login = user.username.toLowerCase()
    const modules = await fetchModules(event).catch(() => undefined) ?? []
    const moduleAuthor = modules.some(module => module.maintainers?.some(maintainer => maintainer.github?.toLowerCase() === login))

    return {
      nuxter: moduleAuthor || canUnlockNuxterRole(nuxter),
      moduleAuthor,
      hackathons: nuxterHackathons(user.providerId).map(hackathon => hackathon.id)
    }
  }
}

/** A period file of the source, with a hash to detect changes. */
interface NuxtersSourceFile {
  period: NuxtersPeriod
  name: string
  /** Git blob sha on GitHub, content hash for a local directory. */
  sha: string
}

interface NuxtersSource {
  commitSha: string
  files: NuxtersSourceFile[]
  read: (file: NuxtersSourceFile) => Promise<unknown>
}

export interface NuxtersSyncResult {
  status: 'imported' | 'skipped'
  commitSha: string
  imported: Array<{ period: NuxtersPeriod, count: number }>
  unchanged: number
}

/**
 * Import the period files of nuxt/nuxters at `sha` (default: the last commit that changed `public/`).
 * Only files whose content changed since the last import are imported, unless `force` is set.
 * `dir` reads a local `public/` directory instead of GitHub (dev only), e.g. a collector test output.
 */
export async function syncNuxters(options: { sha?: string, force?: boolean, dir?: string } = {}): Promise<NuxtersSyncResult> {
  if (options.sha && !/^[0-9a-f]{40}$/i.test(options.sha)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid commit sha: ${options.sha}` })
  }
  if (options.dir && !import.meta.dev) {
    throw createError({ statusCode: 400, statusMessage: 'A local directory can only be imported in development' })
  }

  const source = options.dir ? await localSource(options.dir) : await githubSource(options.sha)
  if (!source.files.some(file => file.period === 'all')) {
    throw createError({ statusCode: 422, statusMessage: `contributors.json not found at ${source.commitSha}` })
  }

  const last = new Map((await nuxters.syncs()).map(sync => [sync.period, sync.sha]))
  // All time first: it is checked against the minimum before anything is written.
  const changed = sortNuxtersPeriods(source.files.map(file => file.period))
    .sort((a, b) => Number(b === 'all') - Number(a === 'all'))
    .map(period => source.files.find(file => file.period === period)!)
    .filter(file => options.force || last.get(file.period) !== file.sha)

  const imported: NuxtersSyncResult['imported'] = []
  for (const file of changed) {
    const rows = parseNuxtersFile(await source.read(file))
    // The minimum guards against a broken CI run. A local directory (dev only) is often a partial
    // run on a few repositories: `COLLECT_REPOS=… pnpm collect:contributors`.
    if (file.period === 'all' && rows.length < NUXTERS_MIN_ROWS && !options.dir) {
      throw createError({ statusCode: 422, statusMessage: `Refusing to import ${rows.length} contributors (minimum ${NUXTERS_MIN_ROWS})` })
    }

    const syncedAt = new Date()
    const statements: BatchItem<'sqlite'>[] = [db.delete(schema.nuxters).where(eq(schema.nuxters.period, file.period))]
    for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
      statements.push(db.insert(schema.nuxters).values(rows.slice(index, index + INSERT_CHUNK_SIZE).map(row => ({
        ...row,
        period: file.period,
        firstContributionAt: row.firstContributionAt ? new Date(row.firstContributionAt) : null,
        syncedAt
      }))))
    }
    const sync = { sha: file.sha, commitSha: source.commitSha, count: rows.length, syncedAt }
    statements.push(db.insert(schema.nuxtersSyncs).values({ period: file.period, ...sync }).onConflictDoUpdate({
      target: schema.nuxtersSyncs.period,
      set: sync
    }))

    // One transaction per period: a leaderboard is never half-imported.
    await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
    imported.push({ period: file.period, count: rows.length })
  }

  return {
    status: imported.length ? 'imported' : 'skipped',
    commitSha: source.commitSha,
    imported,
    unchanged: source.files.length - imported.length
  }
}

function githubHeaders() {
  const token = process.env.NUXT_GITHUB_TOKEN
  return {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'nuxt.com',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function githubSource(sha?: string): Promise<NuxtersSource> {
  const commitSha = sha || await latestNuxtersSha()
  // Lists the blob sha of every file: a file is only downloaded when it changed.
  const entries = await $fetch<Array<{ name: string, sha: string, type: string }>>(
    `https://api.github.com/repos/${NUXTERS_SOURCE.repo}/contents/${NUXTERS_SOURCE.dir}`,
    { query: { ref: commitSha }, headers: githubHeaders() }
  )

  return {
    commitSha,
    files: entries.flatMap((entry) => {
      const period = entry.type === 'file' ? nuxtersPeriodFromFile(entry.name) : null
      return period ? [{ period, name: entry.name, sha: entry.sha }] : []
    }),
    // raw.githubusercontent.com serves `text/plain`: parse it explicitly.
    read: (file): Promise<unknown> => {
      const url: string = nuxtersSourceUrl(commitSha, file.name)
      return $fetch<unknown>(url, { parseResponse: JSON.parse })
    }
  }
}

async function localSource(dir: string): Promise<NuxtersSource> {
  const files: NuxtersSourceFile[] = []
  for (const name of await readdir(dir)) {
    const period = nuxtersPeriodFromFile(name)
    if (!period) continue
    const sha = createHash('sha1').update(await readFile(join(dir, name))).digest('hex')
    files.push({ period, name, sha })
  }
  return {
    commitSha: 'local',
    files,
    read: async file => JSON.parse(await readFile(join(dir, file.name), 'utf8'))
  }
}

/** The last commit on `main` that changed the period files. */
async function latestNuxtersSha(): Promise<string> {
  const [commit] = await $fetch<Array<{ sha: string }>>(`https://api.github.com/repos/${NUXTERS_SOURCE.repo}/commits`, {
    query: { sha: NUXTERS_SOURCE.branch, path: NUXTERS_SOURCE.dir, per_page: 1 },
    headers: githubHeaders()
  })
  if (!commit?.sha) {
    throw createError({ statusCode: 502, statusMessage: `No commit found for ${NUXTERS_SOURCE.repo}/${NUXTERS_SOURCE.dir}` })
  }
  return commit.sha
}
