import { createStorage } from 'unstorage'
import { instanceSource } from './instances'
import type { ContentInstanceKey } from '#shared/utils/content'

/**
 * Ref pointers: which commit an instance's branch currently resolves to, and their cache.
 *
 * Nitro-only — `useRuntimeConfig()` and the ref storage cannot leave the server.
 * The GitHub query itself is in `commits.ts`, which the build module shares.
 */

/** The webhook refreshes production as a push lands; this bounds recovery when delivery fails. */
const PRODUCTION_REF_TTL = 60 * 60

/** No webhook targets a preview deployment, so its pointers recover on TTL alone. */
const PREVIEW_REF_TTL = 600

const refStorage = createStorage({ driver: githubRefCacheDriver(PRODUCTION_REF_TTL) })

const refKey = (repo: string, branch: string, contentDir: string) => {
  const encodedRepo = encodeURIComponent(repo)
  const encodedBranch = encodeURIComponent(branch)
  const encodedContentDir = encodeURIComponent(normalizeContentDir(contentDir))
  return `repo:${encodedRepo}:branch:${encodedBranch}:path:${encodedContentDir}`
}

/** Production owns the long fallback because its webhook is the normal refresh path. */
function refTtl(): number {
  return process.env.VERCEL_ENV === 'production' ? PRODUCTION_REF_TTL : PREVIEW_REF_TTL
}

export function contentGithubToken(): string | undefined {
  return useRuntimeConfig().github.token || process.env.GITHUB_TOKEN || undefined
}

/**
 * Resolve `repo`'s `branch` to the latest commit that touched `contentDir`.
 *
 * Only a successful SHA is cached. A miss or error is not: GitHub returns 404 both
 * when a ref is missing and when the token cannot see the repo, so a cached 404
 * would make a rotated token look like missing content until the TTL expired.
 *
 * `repo` and `branch` come from instance config, never from the request.
 */
export async function resolveContentSha(
  repo: string,
  branch: string,
  contentDir: string,
  opts: { refresh?: boolean } = {}
): Promise<string> {
  if (import.meta.dev) return branch

  const key = refKey(repo, branch, contentDir)
  if (!opts.refresh) {
    const cached = await refStorage.getItem<string>(key)
    if (cached) return cached
  }

  // Shared with the build-time snapshot, which walks the built commit instead of a branch.
  // One query, so the commit a snapshot is stored under is the one it is looked up by.
  let sha: string | undefined
  try {
    sha = await fetchLastContentCommit({
      repo,
      path: contentDir,
      ref: branch,
      token: contentGithubToken()
    })
  } catch (error) {
    // Map a GitHub 404 to our 404. Other failures (5xx, rate-limit 403, network) stay as-is so the next request retries.
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: `Ref not found: ${repo}#${branch}` })
    }
    throw error
  }

  if (!sha) {
    throw createError({ statusCode: 404, statusMessage: `Content not found at ${repo}#${branch}:${contentDir}` })
  }

  await refStorage.setItem(key, sha, { ttl: refTtl() })
  return sha
}

/**
 * The commit `key`'s source reads
 * - in dev the branch name
 * - otherwise the latest commit that touched that source's content directory
 */
export async function resolveInstanceSha(
  key: ContentInstanceKey,
  opts: { refresh?: boolean } = {}
): Promise<string> {
  const { source } = instanceSource(key)

  // `resolveContentSha` itself returns `branch` unresolved in dev.
  return resolveContentSha(source.repo, source.branch, source.contentDir, opts)
}
