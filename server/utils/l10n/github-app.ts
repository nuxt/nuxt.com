import { createPrivateKey, sign } from 'node:crypto'
import { $fetch, FetchError } from 'ofetch'
import type { GitAuthor, GitOpenPull, GitPullRequest, TranslationsGit } from './git'

export interface GitHubAppCredentials {
  appId: string
  /** PEM, as GitHub hands it out; escaped newlines are accepted. */
  privateKey: string
  /** Looked up from the repository when not set. */
  installationId?: string
}

export interface GitHubApp {
  /** An installation token, minted on first use and reused until five minutes before it expires. */
  token: () => Promise<string>
  /** The App's bot account, as a git identity. */
  identity: () => Promise<GitAuthor>
  request: <T>(path: string, options?: GitHubRequestOptions) => Promise<T>
  requestText: (path: string, options?: GitHubRequestOptions) => Promise<string>
}

export interface GitHubRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: Record<string, unknown>
  query?: Record<string, string | number>
  headers?: Record<string, string>
}

/** Files read in one GraphQL query. */
const FILES_PER_QUERY = 100

/** Pages of a pull request's files read, a hundred each: GitHub lists at most 3,000. */
const MAX_FILE_PAGES = 30

/** Pages of open pull requests read, a hundred each. */
const MAX_PULL_PAGES = 10

/** What installation tokens may do: write records and suggestion pull requests, and read team memberships. */
const TOKEN_PERMISSIONS = { contents: 'write', pull_requests: 'write', members: 'read' }

/** Renew installation tokens this long before they expire. */
const TOKEN_MARGIN = 5 * 60_000

/** A JWT authenticating as the App itself, valid nine minutes. */
export function createAppJwt(credentials: Pick<GitHubAppCredentials, 'appId' | 'privateKey'>, now = Date.now()): string {
  // Backdated a minute against clock drift; GitHub rejects an `exp` more than ten minutes ahead.
  const iat = Math.floor(now / 1000) - 60
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat, exp: iat + 600, iss: credentials.appId })}`
  const key = createPrivateKey(credentials.privateKey.replace(/\\n/g, '\n'))
  return `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url')}`
}

/** A client of the GitHub API authenticated as the App's installation on `repo`. */
export function createGitHubApp(credentials: GitHubAppCredentials, { repo, baseURL = 'https://api.github.com' }: { repo: string, baseURL?: string }): GitHubApp {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'nuxt.com', 'X-GitHub-Api-Version': '2022-11-28' }
  let cached: { value: string, expiresAt: number } | undefined
  let pending: Promise<string> | undefined
  let identity: Promise<GitAuthor> | undefined

  const jwtHeaders = () => ({ ...headers, Authorization: `Bearer ${createAppJwt(credentials)}` })

  async function mint(): Promise<string> {
    const jwt = jwtHeaders()
    const installationId = credentials.installationId || (await $fetch<{ id: number }>(`/repos/${repo}/installation`, { baseURL, headers: jwt })).id
    const { token, expires_at } = await $fetch<{ token: string, expires_at: string }>(`/app/installations/${installationId}/access_tokens`, {
      baseURL,
      method: 'POST',
      headers: jwt,
      body: { repositories: [repo.split('/')[1]], permissions: TOKEN_PERMISSIONS }
    })
    cached = { value: token, expiresAt: Date.parse(expires_at) }
    return token
  }

  const token = (): Promise<string> => {
    if (cached && cached.expiresAt - TOKEN_MARGIN > Date.now()) return Promise.resolve(cached.value)
    pending ??= mint().finally(() => {
      pending = undefined
    })
    return pending
  }

  const authorised = async (options: GitHubRequestOptions = {}) => ({
    ...options,
    baseURL,
    headers: { ...headers, ...options.headers, Authorization: `Bearer ${await token()}` }
  })

  async function botIdentity(): Promise<GitAuthor> {
    const { slug } = await $fetch<{ slug: string }>('/app', { baseURL, headers: jwtHeaders() })
    const name = `${slug}[bot]`
    const { id } = await $fetch<{ id: number }>(`/users/${encodeURIComponent(name)}`, await authorised())
    return { name, email: `${id}+${name}@users.noreply.github.com` }
  }

  return {
    token,
    identity: () => identity ??= botIdentity().catch((error) => {
      identity = undefined
      throw error
    }),
    request: async <T>(path: string, options?: GitHubRequestOptions) => $fetch<T>(path, await authorised(options)),
    requestText: async (path: string, options?: GitHubRequestOptions) => $fetch(path, { ...await authorised(options), responseType: 'text' })
  }
}

const status = (error: unknown) => error instanceof FetchError ? error.statusCode : undefined
const message = (error: unknown) => error instanceof FetchError ? String((error.data as { message?: string } | undefined)?.message ?? '') : ''

/** `undefined` for a 404, the value otherwise. */
async function orMissing<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request
  } catch (error) {
    if (status(error) === 404) return undefined
    throw error
  }
}

/** Whether `login` is an active member of the team `org/slug`, through the App's Members read permission. */
export async function isGitHubTeamMember(app: GitHubApp, org: string, slug: string, login: string): Promise<boolean> {
  const membership = await orMissing(app.request<{ state?: string }>(`/orgs/${org}/teams/${slug}/memberships/${encodeURIComponent(login)}`))
  return membership?.state === 'active'
}

/**
 * `repo` through the Git Data API. Commits are authored by the translator and committed by the App,
 * so they show as the translator's on GitHub without any credential of theirs.
 */
export function githubTranslationsGit(app: GitHubApp, repo: string, base = 'main'): TranslationsGit {
  const refPath = (branch: string) => `/repos/${repo}/git/refs/heads/${branch.split('/').map(encodeURIComponent).join('/')}`
  const toPull = (pull: { number: number, html_url: string }): GitPullRequest => ({ number: pull.number, url: pull.html_url })

  return {
    async head(branch) {
      const ref = await orMissing(app.request<{ object: { sha: string } }>(refPath(branch).replace('/git/refs/', '/git/ref/')))
      return ref?.object.sha
    },
    read(commit, path) {
      return orMissing(app.requestText(`/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
        query: { ref: commit },
        headers: { Accept: 'application/vnd.github.raw+json' }
      }))
    },
    async readFiles(commit, paths) {
      const [owner, name] = repo.split('/')
      const files = new Map<string, string>()
      for (let index = 0; index < paths.length; index += FILES_PER_QUERY) {
        const batch = paths.slice(index, index + FILES_PER_QUERY)
        const query = `query($owner: String!, $name: String!${batch.map((_, i) => `, $f${i}: String!`).join('')}) {
          repository(owner: $owner, name: $name) { ${batch.map((_, i) => `f${i}: object(expression: $f${i}) { ... on Blob { text } }`).join(' ')} }
        }`
        const variables = Object.fromEntries([['owner', owner], ['name', name], ...batch.map((path, i) => [`f${i}`, `${commit}:${path}`])])
        const { data, errors } = await app.request<{ data?: { repository?: Record<string, { text?: string | null } | null> }, errors?: unknown }>('/graphql', {
          method: 'POST',
          body: { query, variables }
        })
        if (!data?.repository || (Array.isArray(errors) && errors.length)) throw new Error(`[l10n] could not read ${repo}@${commit}: ${JSON.stringify(errors)}`)
        batch.forEach((path, i) => {
          const text = data.repository![`f${i}`]?.text
          if (typeof text === 'string') files.set(path, text)
        })
      }
      return files
    },
    async commit({ parent, files, message, author }) {
      const date = new Date().toISOString()
      const { tree: { sha: baseTree } } = await app.request<{ tree: { sha: string } }>(`/repos/${repo}/git/commits/${parent}`)
      const tree = await app.request<{ sha: string }>(`/repos/${repo}/git/trees`, {
        method: 'POST',
        body: {
          base_tree: baseTree,
          tree: files.map(({ path, content }) => ({ path, mode: '100644', type: 'blob', content }))
        }
      })
      const commit = await app.request<{ sha: string }>(`/repos/${repo}/git/commits`, {
        method: 'POST',
        body: { message, tree: tree.sha, parents: [parent], author: { ...author, date }, committer: { ...await app.identity(), date } }
      })
      return commit.sha
    },
    async update(branch, sha, { force = false } = {}) {
      try {
        await app.request(refPath(branch), { method: 'PATCH', body: { sha, force } })
        return true
      } catch (error) {
        if (status(error) !== 422) throw error
        if (/fast.forward/i.test(message(error))) return false
        if (!/does not exist/i.test(message(error))) throw error
      }
      try {
        await app.request(`/repos/${repo}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${branch}`, sha } })
        return true
      } catch (error) {
        if (status(error) === 422 && /already exists/i.test(message(error))) return false
        throw error
      }
    },
    async findPull(branch) {
      const [pull] = await app.request<Array<{ number: number, html_url: string }>>(`/repos/${repo}/pulls`, {
        query: { head: `${repo.split('/')[0]}:${branch}`, base, state: 'open', per_page: 1 }
      })
      return pull && toPull(pull)
    },
    async openPull({ branch, title, body }) {
      return toPull(await app.request<{ number: number, html_url: string }>(`/repos/${repo}/pulls`, {
        method: 'POST',
        body: { title, body, head: branch, base }
      }))
    },
    async listPulls() {
      const open: GitOpenPull[] = []
      for (let page = 1; page <= MAX_PULL_PAGES; page++) {
        const pulls = await app.request<Array<{ number: number, html_url: string, head: { ref: string, sha: string, repo: { full_name: string } | null } }>>(`/repos/${repo}/pulls`, {
          query: { base, state: 'open', per_page: 100, page }
        })
        for (const pull of pulls) {
          if (pull.head.repo?.full_name === repo) open.push({ ...toPull(pull), branch: pull.head.ref, head: pull.head.sha })
        }
        if (pulls.length < 100) break
      }
      return open
    },
    async pullFiles(number) {
      const paths: string[] = []
      for (let page = 1; page <= MAX_FILE_PAGES; page++) {
        const files = await app.request<Array<{ filename: string }>>(`/repos/${repo}/pulls/${number}/files`, { query: { per_page: 100, page } })
        paths.push(...files.map(file => file.filename))
        if (files.length < 100) break
      }
      return paths
    }
  }
}
