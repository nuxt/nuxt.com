/**
 * The GitHub `commits` query `refs.ts` and the build-time snapshot share.
 * One implementation, so the two cannot drift on which commit holds the content.
 *
 * Free of nitro auto-imports: `modules/snapshot/` imports this file directly.
 */

export interface LastContentCommitOptions {
  /** `owner/name` of the content repository. */
  repo: string
  /** Content directory; leading and trailing slashes are trimmed. */
  path: string
  /** Branch or commit to walk history from. */
  ref: string
  token?: string
}

/** Leading and trailing slashes off — GitHub's `path` filter matches literally. */
export function normalizeContentDir(contentDir: string): string {
  return contentDir.replace(/^\/+|\/+$/g, '')
}

/**
 * The last commit reachable from `ref` that touched `path`.
 *
 * Throws with a `statusCode` so callers can tell a definitive 404 from a retryable failure.
 */
export async function fetchLastContentCommit(opts: LastContentCommitOptions): Promise<string | undefined> {
  const query = new URLSearchParams({
    sha: opts.ref,
    path: normalizeContentDir(opts.path),
    per_page: '1'
  })

  const response = await fetch(`https://api.github.com/repos/${opts.repo}/commits?${query}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
    }
  })

  if (!response.ok) {
    throw Object.assign(new Error(`GitHub commits query for ${opts.repo}#${opts.ref} failed with ${response.status}`), {
      statusCode: response.status
    })
  }

  const commits = await response.json() as Array<{ sha?: string }>

  return commits[0]?.sha
}
