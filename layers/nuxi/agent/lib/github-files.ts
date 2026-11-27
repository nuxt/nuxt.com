import type { Changes } from './clone.js'

const API = 'https://api.github.com'
/** A branch the coder makes for a task. Same rule as the `branches` guardrail of the GitHub tools. */
const NUXI_BRANCH = /^nuxi\/[a-z0-9][a-z0-9._/-]*$/
/** Any branch this file puts in a URL. */
const BRANCH = /^\w[\w./-]*$/

export class GithubRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'GithubRequestError'
  }
}

/** Where a call goes, and as whom. */
interface Github {
  /** `owner/name` */
  readonly repository: string
  readonly token: string
  readonly fetchImpl?: typeof fetch
}

/** GET `url`, or send `body` to it: bytes as they are, anything else as JSON. */
export async function request<T>({ token, fetchImpl = fetch }: Pick<Github, 'token' | 'fetchImpl'>, url: string, body?: object, method = body ? 'POST' : 'GET'): Promise<T> {
  const binary = body instanceof Uint8Array
  const response = await fetchImpl(url, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      ...(body && { 'content-type': binary ? 'application/octet-stream' : 'application/json' })
    },
    body: binary ? Buffer.from(body) : body && JSON.stringify(body),
    signal: AbortSignal.timeout(60_000)
  })
  const data = await response.json().catch(() => ({})) as T & { message?: string }
  if (!response.ok) {
    throw new GithubRequestError(`GitHub answered HTTP ${response.status} on ${new URL(url).pathname}: ${data.message ?? 'no message'}`, response.status)
  }
  return data
}

/** The number of the open pull request whose head is `branch`, if it has one. */
export async function openPullRequestOf({ branch, ...github }: Github & { readonly branch: string }): Promise<number | undefined> {
  const head = `${github.repository.split('/')[0]}:${branch}`
  const pulls = await request<Array<{ number: number }>>(github, `${API}/repos/${github.repository}/pulls?state=open&per_page=1&head=${encodeURIComponent(head)}`)
  return pulls[0]?.number
}

/** The commit `branch` points to, if the branch exists. */
async function headOf(github: Github, branch: string): Promise<string | undefined> {
  try {
    return (await request<{ object: { sha: string } }>(github, `${API}/repos/${github.repository}/git/ref/heads/${branch}`)).object.sha
  } catch (error) {
    if (error instanceof GithubRequestError && error.status === 404) return undefined
    throw error
  }
}

/**
 * The branches a commit may go to: a `nuxi/*` branch, which the coder makes for a task, or the
 * branch of an open pull request of the repository, which is work in review and where
 * `githubToolsApproval` asks the person first. Never the default branch.
 */
async function assertCommitBranch(github: Github, branch: string): Promise<void> {
  if (!BRANCH.test(branch) || branch.includes('..')) throw new Error(`"${branch}" is not a branch name this tool takes.`)
  if (NUXI_BRANCH.test(branch)) return

  const [{ default_branch }, pullRequest] = await Promise.all([
    request<{ default_branch: string }>(github, `${API}/repos/${github.repository}`),
    openPullRequestOf({ ...github, branch })
  ])
  if (branch === default_branch) throw new Error(`\`${branch}\` is the default branch of ${github.repository}. Commit to a \`nuxi/*\` branch and open a pull request.`)
  if (pullRequest === undefined) throw new Error(`\`${branch}\` is not a \`nuxi/*\` branch and has no open pull request. Commit to a \`nuxi/*\` branch, or to the branch of the open pull request the task is about.`)
}

/** A path as git lists it: relative, and never into `.git`. */
function isTrackedPath(path: string): boolean {
  return !path.split('/').some(segment => segment === '' || segment === '.' || segment === '..' || segment === '.git')
}

type Commit = Changes & { readonly branch: string, readonly message: string }

/**
 * One commit with one parent, the head of `branch`, through `createCommitOnBranch`: GitHub signs
 * it and records the token's owner as its author, and refuses it when the branch moved since.
 */
async function commitOnBranch(github: Github, { branch, message, parents: [head], files, deletions }: Commit): Promise<{ sha: string, url: string }> {
  const [headline = '', ...rest] = message.split('\n')
  const body = rest.join('\n').trim()
  const { data, errors } = await request<{
    data?: { createCommitOnBranch?: { commit?: { oid: string, url: string } } }
    errors?: Array<{ message?: string }>
  }>(github, `${API}/graphql`, {
    query: 'mutation ($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid url } } }',
    variables: {
      input: {
        branch: { repositoryNameWithOwner: github.repository, branchName: branch },
        expectedHeadOid: head,
        message: body ? { headline, body } : { headline },
        fileChanges: {
          additions: files.map(({ path, bytes }) => ({ path, contents: Buffer.from(bytes).toString('base64') })),
          ...(deletions.length ? { deletions: deletions.map(path => ({ path })) } : {})
        }
      }
    }
  })

  const commit = data?.createCommitOnBranch?.commit
  if (!commit) throw new Error(`GitHub refused the commit: ${errors?.map(error => error.message).join('; ') || 'no reason given'}`)
  return { sha: commit.oid, url: commit.url }
}

/**
 * A merge commit, which `createCommitOnBranch` can't make: it gives a commit one parent. Built
 * from its parts instead. GitHub records the token's owner as its author and does not sign it.
 */
async function mergeCommit(github: Github, { message, parents, files, inherited, deletions }: Commit): Promise<{ sha: string, url: string }> {
  const git = `${API}/repos/${github.repository}/git`
  const { tree: base } = await request<{ tree: { sha: string } }>(github, `${git}/commits/${parents[0]}`)

  // One at a time: GitHub limits writes sent together, and a merge leaves few files of its own.
  const written: Array<{ path: string, mode: string, id: string }> = []
  for (const { path, bytes } of files) {
    const blob = await request<{ sha: string }>(github, `${git}/blobs`, { content: Buffer.from(bytes).toString('base64'), encoding: 'base64' })
    written.push({ path, mode: '100644', id: blob.sha })
  }

  const tree = await request<{ sha: string }>(github, `${git}/trees`, {
    base_tree: base.sha,
    tree: [
      ...[...written, ...inherited].map(({ path, mode, id }) => ({ path, mode, type: mode === '160000' ? 'commit' : 'blob', sha: id })),
      ...deletions.map(path => ({ path, mode: '100644', type: 'blob', sha: null }))
    ]
  })
  const commit = await request<{ sha: string, html_url: string }>(github, `${git}/commits`, { message, tree: tree.sha, parents })
  return { sha: commit.sha, url: commit.html_url }
}

/**
 * Commit what was staged in a clone (`clone.ts`) to `branch`, in one commit. A new branch starts
 * at the commit the clone is at. An existing one must point to it: the changes are whole files, so
 * on any other commit they would undo what it holds.
 */
export async function commitChanges({ token, fetchImpl, repository, ...commit }: Github & Commit) {
  const github = { token, fetchImpl, repository }
  const { branch, parents: [base, merged], files, deletions } = commit
  if (!files.length && !deletions.length && !commit.inherited.length) throw new Error('No changes to commit.')
  const stray = [...files, ...commit.inherited].map(file => file.path).concat(deletions).find(path => !isTrackedPath(path))
  if (stray !== undefined) throw new Error(`"${stray}" is not a path in the repository.`)
  await assertCommitBranch(github, branch)

  const head = await headOf(github, branch)
  if (head && head !== base) {
    throw new Error(`\`${branch}\` is at ${head.slice(0, 8)} on GitHub, and the clone is at ${base.slice(0, 8)}. Nothing was committed. Stash your changes, fetch \`${branch}\` and check it out, apply them there, then commit again.`)
  }
  const refs = `${API}/repos/${repository}/git/refs`
  // GitHub answers 422 for a commit it doesn't have: one made in the sandbox with `git commit`.
  const unknownCommit = (error: unknown) => {
    if (!(error instanceof GithubRequestError && error.status === 422)) throw error
    throw new Error(`${error.message}. Nothing was committed. GitHub must have the commit the clone is at, ${base.slice(0, 8)}: undo a commit made in the sandbox with \`git reset --soft\`, then call this again.`)
  }

  let created: { sha: string, url: string }
  if (merged) {
    created = await mergeCommit(github, commit).catch(unknownCommit)
    // Not forced: GitHub refuses to move a branch that someone moved since.
    await (head ? request(github, `${refs}/heads/${branch}`, { sha: created.sha, force: false }, 'PATCH') : request(github, refs, { ref: `refs/heads/${branch}`, sha: created.sha }))
  } else {
    if (!head) await request(github, refs, { ref: `refs/heads/${branch}`, sha: base }).catch(unknownCommit)
    created = await commitOnBranch(github, commit)
  }
  return { repository, branch, createdBranch: !head, commitSha: created.sha, commitUrl: created.url, paths: files.map(file => file.path), deleted: [...deletions] }
}
