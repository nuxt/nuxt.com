import { fetchLastContentCommit } from '../../server/utils/content/commits'
import type { InstanceSource } from '../../server/utils/content/instances'
import { getLastCommit, getTreeSha, hasParent, headCommit } from './git'

export interface SnapshotShaInput {
  /** Where the instance reads from. */
  source: InstanceSource
  /** Repository root of the checkout being built; only used for a `local` source. */
  repoRoot: string
  /** GitHub token, if the build has one. Without it a `local` source falls back to git. */
  token?: string
  /** Reported to the caller; defaults to `console.warn`. */
  warn?: (message: string) => void
}

/** {@link fetchLastContentCommit}, but never throwing: a build-time optimization must not fail a build. */
async function lastContentCommit(
  repo: string,
  contentDir: string,
  ref: string,
  token?: string
): Promise<string | undefined> {
  try {
    const sha = await fetchLastContentCommit({ repo, path: contentDir, ref, token })
    // Validated here rather than in the shared query: this one names a directory in the build.
    return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : undefined
  } catch {
    return undefined
  }
}

/**
 * The commit whose content directory holds what was parsed.
 * The only ref the snapshot may be stored under.
 * The same one `resolveContentSha()` resolves at runtime.
 *
 * A remote source is read at its branch head, so the branch is the question.
 * A `local` source is read from this checkout, so the answer must describe this tree.
 */
export async function resolveSnapshotSha(input: SnapshotShaInput): Promise<string | undefined> {
  const { source, repoRoot, token } = input
  const warn = input.warn ?? ((message: string) => console.warn(message))
  const { repo, contentDir } = source

  if (!source.local) {
    return lastContentCommit(repo, contentDir, source.branch, token)
  }

  const head = headCommit(repoRoot)
  const fromApi = head ? await lastContentCommit(repo, contentDir, head, token) : undefined
  if (fromApi) return fromApi

  // No API answer: fall back to git, which needs the tree check to be trustworthy.
  const parsed = getTreeSha(repoRoot, 'HEAD', contentDir)
  const fromGit = getLastCommit(repoRoot, contentDir)
  if (!parsed || !fromGit) return undefined

  if (getTreeSha(repoRoot, fromGit, contentDir) !== parsed) return undefined

  if (!hasParent(repoRoot, fromGit)) {
    warn(
      `Could not reach the GitHub API, and git labels the snapshot ${fromGit.slice(0, 7)}, `
      + `which has no parent in this checkout — a shallow clone boundary.\n`
      + `  The snapshot is safe, but probably will not be looked up under that commit at runtime.`
    )
  }

  return fromGit
}
