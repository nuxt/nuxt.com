import { checkedMediaType } from './media/media-type.js'

const API = 'https://api.github.com'
/** Same rule as the `branches` guardrail of the GitHub tools. */
const BRANCH = /^nuxi\/[a-z0-9][a-z0-9._/-]*$/
const FILE_PATH = /^[\w.-]+(?:\/[\w.-]+)*$/

/** Showcase screenshots are 80 to 350 KB; an image near this is a mistake, not an asset. */
export const MAX_COMMIT_BYTES = 1024 * 1024

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

interface CommitInput extends Github {
  readonly branch: string
  /** A conventional commit: the first line is the headline, the rest the body. */
  readonly message: string
  /** `path` is the repository path, such as `public/assets/websites/world-triathlon.webp`. */
  readonly files: ReadonlyArray<{ readonly path: string, readonly bytes: Uint8Array }>
}

const COMMIT_MUTATION = 'mutation ($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid url } } }'

/**
 * Commit images to a `nuxi/*` branch in one commit, creating the branch from the default branch
 * when it doesn't exist. `github__editFiles` takes text only, so an image can't go through it.
 * GitHub signs a `createCommitOnBranch` commit and records the token's owner as its author.
 */
export async function commitAssets({ branch, message, files, ...github }: CommitInput) {
  if (!BRANCH.test(branch) || branch.includes('..')) throw new Error(`Images are committed to a \`nuxi/*\` branch only, not "${branch}".`)
  if (!files.length) throw new Error('No files to commit.')
  for (const { path, bytes } of files) {
    if (!FILE_PATH.test(path) || path.includes('..')) throw new Error(`"${path}" is not a path in the repository.`)
    if (checkedMediaType(path, bytes, MAX_COMMIT_BYTES) === 'video/mp4') throw new Error(`"${path}" is a video: only images are committed.`)
  }

  const repository = `${API}/repos/${github.repository}`
  async function headOf(name: string) {
    try {
      return (await request<{ object: { sha: string } }>(github, `${repository}/git/ref/heads/${name}`)).object.sha
    } catch (error) {
      if (error instanceof GithubRequestError && error.status === 404) return undefined
      throw error
    }
  }

  let head = await headOf(branch)
  const createdBranch = !head
  if (!head) {
    const { default_branch } = await request<{ default_branch: string }>(github, repository)
    head = await headOf(default_branch)
    if (!head) throw new Error(`Could not read the head of ${default_branch}.`)
    await request(github, `${repository}/git/refs`, { ref: `refs/heads/${branch}`, sha: head })
  }

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
        fileChanges: { additions: files.map(({ path, bytes }) => ({ path, contents: Buffer.from(bytes).toString('base64') })) }
      }
    }
  })

  const commit = data?.createCommitOnBranch?.commit
  if (!commit) throw new Error(`GitHub refused the commit: ${errors?.map(error => error.message).join('; ') || 'no reason given'}`)

  return { repository: github.repository, branch, createdBranch, commitSha: commit.oid, commitUrl: commit.url, paths: files.map(file => file.path) }
}
