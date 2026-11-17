import { createHash } from 'node:crypto'

/** The author of a commit: the translator, under their GitHub noreply address. */
export interface GitAuthor {
  name: string
  email: string
}

/** One file a commit writes. */
export interface GitFileChange {
  path: string
  content: string
}

export interface GitCommitInput {
  parent: string
  files: GitFileChange[]
  message: string
  author: GitAuthor
}

export interface GitPullRequest {
  number: number
  url: string
}

/** An open pull request into the default branch. */
export interface GitOpenPull extends GitPullRequest {
  branch: string
  /** Head commit. */
  head: string
}

/**
 * The operations the write path runs on the translations repository.
 * Commits are created detached and only land when `update` moves a branch to them.
 */
export interface TranslationsGit {
  /** Head commit of `branch`, `undefined` when there is no such branch. */
  head: (branch: string) => Promise<string | undefined>
  /** Text of `path` at `commit`, `undefined` when there is no such file. */
  read: (commit: string, path: string) => Promise<string | undefined>
  /** Texts of `paths` at `commit`, in as few requests as the repository allows; missing files are left out. */
  readFiles: (commit: string, paths: string[]) => Promise<Map<string, string>>
  /** A new commit on top of `parent` with `files` changed. The committer is the repository's own identity. */
  commit: (input: GitCommitInput) => Promise<string>
  /**
   * Point `branch` at `sha`, creating it when missing. Without `force`, `false` when that is not a
   * fast-forward, that is when the branch moved since `sha`'s parent was read.
   */
  update: (branch: string, sha: string, options?: { force?: boolean }) => Promise<boolean>
  /** The open pull request from `branch` into the default branch. */
  findPull: (branch: string) => Promise<GitPullRequest | undefined>
  openPull: (input: { branch: string, title: string, body: string }) => Promise<GitPullRequest>
  /** Comment on a pull request, as the repository's own identity. */
  comment: (number: number, body: string) => Promise<void>
  /** Every open pull request into the default branch from a branch of the repository itself. */
  listPulls: () => Promise<GitOpenPull[]>
  /** Paths a pull request changes. */
  pullFiles: (number: number) => Promise<string[]>
}

/** What a dry run would have written. */
export interface DryRunLog {
  commits: Array<GitCommitInput & { sha: string }>
  updates: Array<{ branch: string, sha: string, force: boolean }>
  pulls: Array<{ branch: string, title: string, body: string } & GitPullRequest>
  comments: Array<{ number: number, body: string }>
}

/**
 * A repository that reads from `base` and keeps every write in memory, in `log`.
 * Commits it creates can be read back and built on, so a whole save or suggestion runs as it would on GitHub.
 */
export function dryRunGit(base: Pick<TranslationsGit, 'head' | 'read'>): TranslationsGit & { log: DryRunLog } {
  const log: DryRunLog = { commits: [], updates: [], pulls: [], comments: [] }
  const commits = new Map<string, { parent: string, files: Map<string, string> }>()
  const heads = new Map<string, string>()
  const pulls = new Map<string, GitPullRequest & { files: Set<string> }>()

  const read = async (commit: string, path: string): Promise<string | undefined> => {
    for (let sha: string | undefined = commit; sha;) {
      const local = commits.get(sha)
      if (!local) return base.read(sha, path)
      if (local.files.has(path)) return local.files.get(path)
      sha = local.parent
    }
  }

  const isAncestor = async (ancestor: string, sha: string): Promise<boolean> => {
    for (let current: string | undefined = sha; current;) {
      if (current === ancestor) return true
      const local = commits.get(current)
      if (!local) return false
      current = local.parent
    }
    return false
  }

  const head = async (branch: string) => heads.get(branch) ?? base.head(branch)

  return {
    log,
    head,
    read,
    async readFiles(commit, paths) {
      const files = new Map<string, string>()
      for (const path of paths) {
        const text = await read(commit, path)
        if (text !== undefined) files.set(path, text)
      }
      return files
    },
    async commit(input) {
      const sha = createHash('sha1').update(JSON.stringify([input, commits.size])).digest('hex')
      commits.set(sha, { parent: input.parent, files: new Map(input.files.map(file => [file.path, file.content])) })
      log.commits.push({ ...input, sha })
      return sha
    },
    async update(branch, sha, { force = false } = {}) {
      const current = await head(branch)
      if (current && !force && !(await isAncestor(current, sha))) return false
      heads.set(branch, sha)
      const pull = pulls.get(branch)
      for (let commit = commits.get(sha); pull && commit; commit = commits.get(commit.parent)) {
        for (const path of commit.files.keys()) pull.files.add(path)
      }
      log.updates.push({ branch, sha, force })
      return true
    },
    async findPull(branch) {
      const pull = pulls.get(branch)
      return pull && { number: pull.number, url: pull.url }
    },
    async openPull(input) {
      const pull = { number: log.pulls.length + 1, url: `dry-run://pull/${log.pulls.length + 1}` }
      const files = new Set<string>()
      for (let commit = commits.get(heads.get(input.branch) ?? ''); commit; commit = commits.get(commit.parent)) {
        for (const path of commit.files.keys()) files.add(path)
      }
      pulls.set(input.branch, { ...pull, files })
      log.pulls.push({ ...input, ...pull })
      return pull
    },
    async comment(number, body) {
      log.comments.push({ number, body })
    },
    async listPulls() {
      return Promise.all([...pulls].map(async ([branch, pull]) => ({ number: pull.number, url: pull.url, branch, head: (await head(branch))! })))
    },
    async pullFiles(number) {
      return [...[...pulls.values()].find(pull => pull.number === number)?.files ?? []]
    }
  }
}
