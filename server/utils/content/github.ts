import { createStorage } from 'unstorage'

const refStorage = createStorage({ driver: githubRefCacheDriver() })

const normalizeContentDir = (contentDir: string) => contentDir.replace(/^\/+|\/+$/g, '')

const refKey = (repo: string, branch: string, contentDir: string) => {
  const encodedRepo = encodeURIComponent(repo)
  const encodedBranch = encodeURIComponent(branch)
  const encodedContentDir = encodeURIComponent(normalizeContentDir(contentDir))
  return `repo:${encodedRepo}:branch:${encodedBranch}:path:${encodedContentDir}`
}

export function contentGithubToken(): string | undefined {
  return useRuntimeConfig().github.token || process.env.GITHUB_TOKEN || undefined
}

/**
 * Resolve `repo`'s `branch` to the latest commit that touched `contentDir`.
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

  const token = contentGithubToken()
  const commits = await $fetch<Array<{ sha: string }>>(`https://api.github.com/repos/${repo}/commits`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    query: {
      sha: branch,
      path: normalizeContentDir(contentDir),
      per_page: 1
    }
  })

  const sha = commits[0]?.sha
  if (!sha) {
    throw createError({ statusCode: 404, statusMessage: `Content not found at ${repo}#${branch}:${contentDir}` })
  }

  await refStorage.setItem(key, sha)
  return sha
}
