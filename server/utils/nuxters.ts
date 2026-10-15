import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { H3Event } from 'h3'
import type { BatchItem } from 'drizzle-orm/batch'
import { and, asc, count, eq, inArray, sql, sum } from 'drizzle-orm'
import type { NuxterBadges, NuxterLinks, NuxterProfile, NuxtersPage, NuxtersPeriod, NuxterSummary } from '#shared/types'
import {
  NUXTERS_MIN_ROWS,
  NUXTERS_PROFILES_FILE,
  NUXTERS_SOURCE,
  canUnlockNuxterRole,
  nuxterHackathons,
  nuxtersPeriodFromFile,
  isNuxtersPeriod,
  nuxtersSourceUrl,
  parseNuxterProfilesFile,
  parseNuxtersFile,
  rowToNuxter,
  sortNuxtersPeriods
} from '#shared/utils/nuxters'

/** 18 columns per row: stays well under SQLite's 32,766 bound-variable limit. */
const INSERT_CHUNK_SIZE = 500
/** The `nuxters_syncs` key of `profiles.json`: never a period. */
const PROFILES_SYNC_KEY = 'profiles'

type NuxterDbRow = typeof schema.nuxters.$inferSelect

function toProfile(rows: NuxterDbRow[], links: NuxterLinks | null): NuxterProfile | null {
  const allTime = rows.find(row => row.period === 'all')
  if (!allTime) return null

  const byPeriod = new Map(rows.map(row => [row.period, row]))
  return {
    ...rowToNuxter(allTime),
    // Full stats per period (14 rows at most): the profile switches period without a request.
    periods: sortNuxtersPeriods(rows.map(row => row.period).filter(period => period !== 'all')).map((period) => {
      const { githubId: _id, username: _username, firstContributionAt: _first, ...stats } = rowToNuxter(byPeriod.get(period)!)
      return { period, ...stats }
    }),
    links
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
    const [rows, [links]] = await Promise.all([
      db.select().from(schema.nuxters).where(eq(schema.nuxters.githubId, id)),
      db.select({
        name: schema.nuxterProfiles.name,
        website: schema.nuxterProfiles.website,
        socialAccounts: schema.nuxterProfiles.socialAccounts
      }).from(schema.nuxterProfiles).where(eq(schema.nuxterProfiles.githubId, id))
    ])
    return toProfile(rows, links ?? null)
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

  /**
   * Usernames containing `query` in a period: names starting with it first, then by rank.
   * About 27k rows at most per period, so a scan is fast enough and needs no extra index.
   */
  async search({ query, period = 'all', limit = 8 }: { query: string, period?: NuxtersPeriod, limit?: number }): Promise<NuxterSummary[]> {
    const term = query.trim().toLowerCase()
    if (!term) return []
    const position = sql`instr(${schema.nuxters.usernameLower}, ${term})`
    return db.select({
      githubId: schema.nuxters.githubId,
      username: schema.nuxters.username,
      rank: schema.nuxters.rank,
      score: schema.nuxters.score
    }).from(schema.nuxters)
      .where(and(eq(schema.nuxters.period, period), sql`${position} > 0`))
      .orderBy(sql`case when ${position} = 1 then 0 else 1 end`, asc(schema.nuxters.rank))
      .limit(limit)
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

  /**
   * Which of these people have a Nuxter profile: GitHub ids (stable across renames) and lowercased usernames
   * (for lists that only have the login, like module maintainers). Looked up 100 at a time: D1 binds 100 values at most.
   */
  async known({ githubIds = [], usernames = [] }: { githubIds?: number[], usernames?: string[] }): Promise<{ githubIds: Set<number>, usernames: Set<string> }> {
    const chunks = <T>(values: T[]) => Array.from({ length: Math.ceil(values.length / 100) }, (_, index) => values.slice(index * 100, index * 100 + 100))
    const ids = [...new Set(githubIds.filter(id => Number.isSafeInteger(id)))]
    const logins = [...new Set(usernames.map(username => username.toLowerCase()))]
    const rows = await Promise.all([
      ...chunks(ids).map(chunk => db.select({ githubId: schema.nuxters.githubId, usernameLower: schema.nuxters.usernameLower }).from(schema.nuxters)
        .where(and(eq(schema.nuxters.period, 'all'), inArray(schema.nuxters.githubId, chunk)))),
      ...chunks(logins).map(chunk => db.select({ githubId: schema.nuxters.githubId, usernameLower: schema.nuxters.usernameLower }).from(schema.nuxters)
        .where(and(eq(schema.nuxters.period, 'all'), inArray(schema.nuxters.usernameLower, chunk))))
    ])
    return {
      githubIds: new Set(rows.flat().map(row => row.githubId)),
      usernames: new Set(rows.flat().map(row => row.usernameLower))
    }
  },

  /** The imported period files, one per period. */
  async syncs() {
    const syncs = await db.select().from(schema.nuxtersSyncs)
    return syncs.filter(sync => isNuxtersPeriod(sync.period))
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
  /** `profiles.json`, missing from commits before it was collected. */
  profiles: Omit<NuxtersSourceFile, 'period'> | null
  read: (file: Pick<NuxtersSourceFile, 'name'>) => Promise<unknown>
}

export interface NuxtersSyncResult {
  status: 'imported' | 'skipped'
  commitSha: string
  imported: Array<{ period: NuxtersPeriod, count: number }>
  /** Periods whose file is no longer in the source: their rows are deleted. */
  removed: NuxtersPeriod[]
  unchanged: number
  /** Profiles imported from `profiles.json`, `null` when the file did not change or is missing. */
  profiles: number | null
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

  // The source is the reference: a period whose file is gone must leave the leaderboard too.
  const removed = [...last.keys()].filter(period => !source.files.some(file => file.period === period))
  if (removed.length) {
    await db.batch([
      db.delete(schema.nuxters).where(inArray(schema.nuxters.period, removed)),
      db.delete(schema.nuxtersSyncs).where(inArray(schema.nuxtersSyncs.period, removed))
    ])
  }

  const profiles = await importProfiles(source, options.force)

  return {
    status: imported.length || removed.length || profiles !== null ? 'imported' : 'skipped',
    commitSha: source.commitSha,
    imported,
    removed,
    unchanged: source.files.length - imported.length,
    profiles
  }
}

/**
 * Replace the links with `profiles.json`, when it changed. A missing file (older commit, or a collector
 * run where GitHub failed to return them) keeps the current links: they are a bonus, not the reference.
 */
async function importProfiles(source: NuxtersSource, force?: boolean): Promise<number | null> {
  const file = source.profiles
  if (!file) return null
  const [last] = await db.select({ sha: schema.nuxtersSyncs.sha }).from(schema.nuxtersSyncs)
    .where(eq(schema.nuxtersSyncs.period, PROFILES_SYNC_KEY))
  if (!force && last?.sha === file.sha) return null

  const rows = parseNuxterProfilesFile(await source.read(file))
  const syncedAt = new Date()
  const statements: BatchItem<'sqlite'>[] = [db.delete(schema.nuxterProfiles)]
  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    statements.push(db.insert(schema.nuxterProfiles).values(rows.slice(index, index + INSERT_CHUNK_SIZE).map(row => ({ ...row, syncedAt }))))
  }
  const sync = { sha: file.sha, commitSha: source.commitSha, count: rows.length, syncedAt }
  statements.push(db.insert(schema.nuxtersSyncs).values({ period: PROFILES_SYNC_KEY, ...sync }).onConflictDoUpdate({
    target: schema.nuxtersSyncs.period,
    set: sync
  }))
  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
  return rows.length
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

  const profiles = entries.find(entry => entry.type === 'file' && entry.name === NUXTERS_PROFILES_FILE)
  return {
    commitSha,
    files: entries.flatMap((entry) => {
      const period = entry.type === 'file' ? nuxtersPeriodFromFile(entry.name) : null
      return period ? [{ period, name: entry.name, sha: entry.sha }] : []
    }),
    profiles: profiles ? { name: profiles.name, sha: profiles.sha } : null,
    // raw.githubusercontent.com serves `text/plain`: parse it explicitly.
    read: (file): Promise<unknown> => {
      const url: string = nuxtersSourceUrl(commitSha, file.name)
      return $fetch<unknown>(url, { parseResponse: JSON.parse })
    }
  }
}

async function localSource(dir: string): Promise<NuxtersSource> {
  const files: NuxtersSourceFile[] = []
  let profiles: NuxtersSource['profiles'] = null
  for (const name of await readdir(dir)) {
    const period = nuxtersPeriodFromFile(name)
    if (!period && name !== NUXTERS_PROFILES_FILE) continue
    const sha = createHash('sha1').update(await readFile(join(dir, name))).digest('hex')
    if (period) files.push({ period, name, sha })
    else profiles = { name, sha }
  }
  return {
    commitSha: 'local',
    files,
    profiles,
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
