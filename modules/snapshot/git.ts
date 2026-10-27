import { execFileSync } from 'node:child_process'

/** Run git with an argv array — no shell, so paths with spaces need no quoting. */
function git(args: string[], cwd: string): string | undefined {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return undefined
  }
}

/** The commit checked out here, falling back to the CI-provided one. */
export function headCommit(cwd: string): string | undefined {
  const sha = git(['rev-parse', 'HEAD'], cwd) || process.env.VERCEL_GIT_COMMIT_SHA
  return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : undefined
}

/**
 * The last commit touching `dir`, or `undefined`.
 *
 * Unverified on purpose.
 * CI clones shallowly, and git answers with the shallow boundary commit rather than nothing.
 * At depth 1 that is HEAD for every path, so confirm with {@link getTreeSha} before trusting it.
 */
export function getLastCommit(cwd: string, dir: string): string | undefined {
  const sha = git(['log', '-1', '--format=%H', '--', dir], cwd)
  return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : undefined
}

/** Tree object id of `<ref>:<dir>`, or `undefined` when the ref or path is not in this checkout. */
export function getTreeSha(cwd: string, ref: string, dir: string): string | undefined {
  return git(['rev-parse', `${ref}:${dir}`], cwd)
}

/** Whether `ref` has a parent in this checkout. `false` at a shallow-clone boundary. */
export function hasParent(cwd: string, ref: string): boolean {
  return Boolean(git(['rev-parse', '--verify', `${ref}^`], cwd))
}
