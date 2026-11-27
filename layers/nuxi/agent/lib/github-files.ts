import { checkedMediaType } from './media/media-type.js'

const API = 'https://api.github.com'
/** Same rule as the `branches` guardrail of the GitHub tools. */
const BRANCH = /^nuxi\/[a-z0-9][a-z0-9._/-]*$/
const FILE_PATH = /^[\w.-]+(?:\/[\w.-]+)*$/

/**
 * A blog cover at 2400x1260 is a PNG of 0.5 to 2.5 MB, and most images of `public/assets/blog` over
 * 1 MB are under this. Showcase screenshots are 80 to 350 KB: the skill that makes them holds them to that.
 */
export const MAX_COMMIT_BYTES = 4 * 1024 * 1024

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

/** GET `url`, or POST `body` to it: bytes as they are, anything else as JSON. */
export async function request<T>({ token, fetchImpl = fetch }: Pick<Github, 'token' | 'fetchImpl'>, url: string, body?: object): Promise<T> {
  const binary = body instanceof Uint8Array
  const response = await fetchImpl(url, {
    method: body ? 'POST' : 'GET',
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

const COMMIT_MUTATION = 'mutation ($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid url } } }'

function assertNuxiBranch(branch: string) {
  if (!BRANCH.test(branch) || branch.includes('..')) throw new Error(`Commits go to a \`nuxi/*\` branch only, not "${branch}".`)
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

function createBranch(github: Github, branch: string, sha: string) {
  return request(github, `${API}/repos/${github.repository}/git/refs`, { ref: `refs/heads/${branch}`, sha })
}

interface CommitOnBranch {
  readonly branch: string
  /** The commit the branch must point to: GitHub refuses the commit when someone moved it since. */
  readonly head: string
  /** A conventional commit: the first line is the headline, the rest the body. */
  readonly message: string
  readonly additions: ReadonlyArray<{ readonly path: string, readonly bytes: Uint8Array }>
  readonly deletions?: readonly string[]
}

/** One commit on `branch`. GitHub signs a `createCommitOnBranch` commit and records the token's owner as its author. */
async function commitOnBranch(github: Github, { branch, head, message, additions, deletions = [] }: CommitOnBranch) {
  const [headline = '', ...rest] = message.trim().split('\n')
  const body = rest.join('\n').trim()
  const { data, errors } = await request<{
    data?: { createCommitOnBranch?: { commit?: { oid: string, url: string } } }
    errors?: Array<{ message?: string }>
  }>(github, `${API}/graphql`, {
    query: COMMIT_MUTATION,
    variables: {
      input: {
        branch: { repositoryNameWithOwner: github.repository, branchName: branch },
        expectedHeadOid: head,
        message: body ? { headline, body } : { headline },
        fileChanges: {
          additions: additions.map(({ path, bytes }) => ({ path, contents: Buffer.from(bytes).toString('base64') })),
          ...(deletions.length ? { deletions: deletions.map(path => ({ path })) } : {})
        }
      }
    }
  })

  const commit = data?.createCommitOnBranch?.commit
  if (!commit) throw new Error(`GitHub refused the commit: ${errors?.map(error => error.message).join('; ') || 'no reason given'}`)
  return { commitSha: commit.oid, commitUrl: commit.url }
}

interface AssetsInput extends Github {
  readonly branch: string
  readonly message: string
  /** `path` is the repository path, such as `public/assets/websites/world-triathlon.webp`. */
  readonly files: ReadonlyArray<{ readonly path: string, readonly bytes: Uint8Array }>
}

/**
 * Commit images to a `nuxi/*` branch in one commit, creating the branch from the default branch
 * when it doesn't exist. `github__editFiles` takes text only, so an image can't go through it.
 */
export async function commitAssets({ branch, message, files, ...github }: AssetsInput) {
  assertNuxiBranch(branch)
  if (!files.length) throw new Error('No files to commit.')
  for (const { path, bytes } of files) {
    if (!FILE_PATH.test(path) || path.includes('..')) throw new Error(`"${path}" is not a path in the repository.`)
    if (checkedMediaType(path, bytes, MAX_COMMIT_BYTES) === 'video/mp4') throw new Error(`"${path}" is a video: only images are committed.`)
  }

  let head = await headOf(github, branch)
  const createdBranch = !head
  if (!head) {
    const { default_branch } = await request<{ default_branch: string }>(github, `${API}/repos/${github.repository}`)
    head = await headOf(github, default_branch)
    if (!head) throw new Error(`Could not read the head of ${default_branch}.`)
    await createBranch(github, branch, head)
  }

  const commit = await commitOnBranch(github, { branch, head, message, additions: files })
  return { repository: github.repository, branch, createdBranch, ...commit, paths: files.map(file => file.path) }
}

interface ChangesInput extends Github {
  readonly branch: string
  readonly message: string
  /** The commit the changes were made on, which GitHub has. */
  readonly base: string
  /** `path` is the repository path, as git names it. */
  readonly additions: ReadonlyArray<{ readonly path: string, readonly bytes: Uint8Array }>
  readonly deletions: readonly string[]
}

/** A path as git lists it: relative, and never into `.git`. Unlike `FILE_PATH`, it can hold `[slug].vue` or a space. */
function isTrackedPath(path: string): boolean {
  return !path.split('/').some(segment => segment === '' || segment === '.' || segment === '..' || segment === '.git')
}

/**
 * Commit what changed in a checkout (`checkout.ts`) to a `nuxi/*` branch in one commit: files of
 * any kind, added, modified or deleted. A new branch starts at `base`. An existing one must point
 * to `base`: the changes are whole files, so on any other commit they would undo what it holds.
 */
export async function commitChanges({ branch, message, base, additions, deletions, ...github }: ChangesInput) {
  assertNuxiBranch(branch)
  if (!additions.length && !deletions.length) throw new Error('No changes to commit.')
  const stray = [...additions.map(file => file.path), ...deletions].find(path => !isTrackedPath(path))
  if (stray !== undefined) throw new Error(`"${stray}" is not a path in the repository.`)

  const head = await headOf(github, branch)
  if (head && head !== base) {
    throw new Error(`\`${branch}\` is at ${head.slice(0, 8)}, and the checkout is based on ${base.slice(0, 8)}. Check out \`${branch}\` with \`fresh: true\` and make the change there, or commit to a new branch.`)
  }
  if (!head) await createBranch(github, branch, base)

  const commit = await commitOnBranch(github, { branch, head: base, message, additions, deletions })
  return { repository: github.repository, branch, createdBranch: !head, ...commit, paths: additions.map(file => file.path), deleted: [...deletions] }
}
