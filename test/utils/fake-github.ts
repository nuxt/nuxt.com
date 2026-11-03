import { execFileSync } from 'node:child_process'
import { generateKeyPairSync, verify } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export const FAKE_INSTALLATION_TOKEN = 'ghs_fake'
export const FAKE_BOT = { slug: 'nuxt-translations', id: 4242 }

interface FakePull { number: number, head: string, base: string, title: string, body: string, state: 'open' | 'closed', from?: string }

/**
 * A bare git repository behind the slice of the GitHub API the write path uses: App authentication,
 * team memberships, contents, the Git Data API and pull requests.
 */
export async function createFakeGitHub({ repo = 'nuxt/translations', files = {} as Record<string, string>, teams = {} as Record<string, string[]> } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fake-github-'))
  const bare = join(root, 'repo.git')
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()
  const pulls: FakePull[] = []
  const requests: Array<{ method: string, path: string, authorization?: string, body?: unknown }> = []
  let queryErrors: Array<{ message: string }> | undefined

  const git = (args: string[], options: { input?: string, env?: Record<string, string> } = {}) =>
    execFileSync('git', ['--git-dir', bare, ...args], { input: options.input, env: { ...process.env, ...options.env }, encoding: 'utf8' }).trim()

  execFileSync('git', ['init', '--quiet', '--bare', '--initial-branch=main', bare])
  const work = join(root, 'work')
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(work, path)), { recursive: true })
    writeFileSync(join(work, path), content)
  }
  execFileSync('git', ['--git-dir', bare, '--work-tree', work, 'add', '-A'])
  execFileSync('git', ['--git-dir', bare, '--work-tree', work, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'init'])

  const refExists = (branch: string) => {
    try {
      git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])
      return true
    } catch {
      return false
    }
  }
  const isAncestor = (ancestor: string, sha: string) => {
    try {
      git(['merge-base', '--is-ancestor', ancestor, sha])
      return true
    } catch {
      return false
    }
  }

  function checkJwt(authorization: string | undefined): boolean {
    const [header, payload, signature] = authorization?.replace(/^Bearer /, '').split('.') ?? []
    if (!header || !payload || !signature) return false
    return verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, 'base64url'))
  }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url!, 'http://127.0.0.1')
    const path = decodeURIComponent(url.pathname)
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined
    requests.push({ method: req.method!, path, authorization: req.headers.authorization, body })
    const send = (status: number, value?: unknown, type = 'application/json') => {
      res.writeHead(status, { 'content-type': type })
      res.end(type === 'application/json' ? JSON.stringify(value ?? {}) : value as string)
    }
    const fail = (status: number, message: string) => send(status, { message })

    if (path === '/app' || path === `/repos/${repo}/installation` || path.startsWith('/app/installations/')) {
      if (!checkJwt(req.headers.authorization)) return fail(401, 'A JSON web token could not be decoded')
      if (path === '/app') return send(200, { slug: FAKE_BOT.slug })
      if (path.endsWith('/installation')) return send(200, { id: 1 })
      return send(201, { token: FAKE_INSTALLATION_TOKEN, expires_at: new Date(Date.now() + 3_600_000).toISOString() })
    }
    if (req.headers.authorization !== `Bearer ${FAKE_INSTALLATION_TOKEN}`) return fail(401, 'Bad credentials')
    if (path === `/users/${FAKE_BOT.slug}[bot]`) return send(200, { id: FAKE_BOT.id })

    if (req.method === 'POST' && path === '/graphql') {
      const { owner, name, ...expressions } = body.variables as Record<string, string>
      if (`${owner}/${name}` !== repo) return send(200, { errors: [{ message: 'Could not resolve to a Repository' }] })
      const repository: Record<string, { text: string } | null> = {}
      const errors = queryErrors
      queryErrors = undefined
      for (const [alias, expression] of Object.entries(expressions)) {
        if (errors) {
          repository[alias] = null
          continue
        }
        try {
          repository[alias] = { text: `${git(['show', expression])}\n` }
        } catch {
          repository[alias] = null
        }
      }
      return send(200, { data: { repository }, ...(errors && { errors }) })
    }

    const membership = /^\/orgs\/[^/]+\/teams\/([^/]+)\/memberships\/([^/]+)$/.exec(path)
    if (membership) return teams[membership[1]!]?.includes(membership[2]!) ? send(200, { state: 'active' }) : fail(404, 'Not Found')

    const prefix = `/repos/${repo}`
    if (!path.startsWith(prefix)) return fail(404, 'Not Found')
    const route = path.slice(prefix.length)

    if (req.method === 'GET' && route.startsWith('/git/ref/heads/')) {
      const branch = route.slice('/git/ref/heads/'.length)
      return refExists(branch) ? send(200, { object: { sha: git(['rev-parse', `refs/heads/${branch}`]) } }) : fail(404, 'Not Found')
    }
    if (req.method === 'GET' && route.startsWith('/contents/')) {
      try {
        return send(200, git(['show', `${url.searchParams.get('ref')}:${route.slice('/contents/'.length)}`]) + '\n', 'text/plain')
      } catch {
        return fail(404, 'Not Found')
      }
    }
    if (req.method === 'GET' && route.startsWith('/git/commits/')) {
      return send(200, { tree: { sha: git(['rev-parse', `${route.slice('/git/commits/'.length)}^{tree}`]) } })
    }
    if (req.method === 'POST' && route === '/git/trees') {
      const env = { GIT_INDEX_FILE: join(root, `index-${Date.now()}-${Math.random()}`) }
      git(['read-tree', body.base_tree], { env })
      const lines = (body.tree as Array<{ path: string, content: string }>).map(entry =>
        `100644 ${git(['hash-object', '-w', '--stdin'], { input: entry.content })}\t${entry.path}`)
      git(['update-index', '--index-info'], { env, input: `${lines.join('\n')}\n` })
      return send(201, { sha: git(['write-tree'], { env }) })
    }
    if (req.method === 'POST' && route === '/git/commits') {
      const { author, committer } = body as Record<'author' | 'committer', { name: string, email: string, date: string }>
      const sha = git(['commit-tree', body.tree, ...body.parents.flatMap((parent: string) => ['-p', parent]), '-m', body.message], {
        env: {
          GIT_AUTHOR_NAME: author.name,
          GIT_AUTHOR_EMAIL: author.email,
          GIT_AUTHOR_DATE: author.date,
          GIT_COMMITTER_NAME: committer?.name ?? author.name,
          GIT_COMMITTER_EMAIL: committer?.email ?? author.email,
          GIT_COMMITTER_DATE: committer?.date ?? author.date
        }
      })
      return send(201, { sha })
    }
    if (req.method === 'PATCH' && route.startsWith('/git/refs/heads/')) {
      const branch = route.slice('/git/refs/heads/'.length)
      if (!refExists(branch)) return fail(422, 'Reference does not exist')
      if (!body.force && !isAncestor(git(['rev-parse', `refs/heads/${branch}`]), body.sha)) return fail(422, 'Update is not a fast forward')
      git(['update-ref', `refs/heads/${branch}`, body.sha])
      return send(200, { object: { sha: body.sha } })
    }
    if (req.method === 'POST' && route === '/git/refs') {
      if (refExists(body.ref.replace('refs/heads/', ''))) return fail(422, 'Reference already exists')
      git(['update-ref', body.ref, body.sha])
      return send(201, { object: { sha: body.sha } })
    }
    if (req.method === 'GET' && route === '/pulls') {
      const [owner, head] = url.searchParams.get('head')?.split(':') ?? []
      const perPage = Number(url.searchParams.get('per_page') ?? 30)
      const page = Number(url.searchParams.get('page') ?? 1)
      return send(200, pulls
        .filter(pull => pull.state === 'open' && (!head || (pull.head === head && (pull.from ?? repo).split('/')[0] === owner)))
        .slice((page - 1) * perPage, page * perPage)
        .map(pull => ({
          number: pull.number,
          html_url: `https://github.com/${repo}/pull/${pull.number}`,
          head: { ref: pull.head, sha: git(['rev-parse', pull.from ? `refs/pull/${pull.number}/head` : `refs/heads/${pull.head}`]), repo: { full_name: pull.from ?? repo } }
        })))
    }
    const files = /^\/pulls\/(\d+)\/files$/.exec(route)
    if (req.method === 'GET' && files) {
      const pull = pulls.find(item => item.number === Number(files[1]))
      if (!pull || url.searchParams.get('page') !== '1') return send(200, [])
      const ref = pull.from ? `refs/pull/${pull.number}/head` : pull.head
      const mergeBase = git(['merge-base', pull.base, ref])
      return send(200, git(['diff', '--name-only', mergeBase, ref]).split('\n').filter(Boolean).map(filename => ({ filename })))
    }
    if (req.method === 'POST' && route === '/pulls') {
      const pull: FakePull = { number: pulls.length + 1, head: body.head, base: body.base, title: body.title, body: body.body, state: 'open' }
      pulls.push(pull)
      return send(201, { number: pull.number, html_url: `https://github.com/${repo}/pull/${pull.number}` })
    }

    return fail(404, `No fake for ${req.method} ${path}`)
  }

  const server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ message: String(error?.stderr || error) }))
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    baseURL: `http://127.0.0.1:${port}`,
    privateKey: pem,
    pulls,
    requests,
    git,
    /** Reply to the next GraphQL query with null fields and `message` as an error, as a partial failure does. */
    failNextQuery(message: string) {
      queryErrors = [{ message }]
    },
    /** Open a pull request from a fork's `branch`, changing `path`. */
    openForkPull(from: string, branch: string, path: string, content: string) {
      const number = pulls.length + 1
      git(['update-ref', `refs/pull/${number}/head`, git(['rev-parse', 'refs/heads/main'])])
      const env = { GIT_INDEX_FILE: join(root, `index-fork-${Date.now()}`) }
      git(['read-tree', 'main'], { env })
      const blob = git(['hash-object', '-w', '--stdin'], { input: content })
      git(['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`], { env })
      const tree = git(['write-tree'], { env })
      const sha = git(['commit-tree', tree, '-p', 'main', '-m', 'fork'], { env: { GIT_AUTHOR_NAME: 'fork', GIT_AUTHOR_EMAIL: 'fork@example.com', GIT_COMMITTER_NAME: 'fork', GIT_COMMITTER_EMAIL: 'fork@example.com' } })
      git(['update-ref', `refs/pull/${number}/head`, sha])
      pulls.push({ number, head: branch, base: 'main', title: 'fork', body: '', state: 'open', from })
      return number
    },
    /** Commit straight to a branch, as another writer would. */
    push(branch: string, path: string, content: string) {
      const parent = git(['rev-parse', `refs/heads/${branch}`])
      const env = { GIT_INDEX_FILE: join(root, `index-push-${Date.now()}`) }
      git(['read-tree', parent], { env })
      const blob = git(['hash-object', '-w', '--stdin'], { input: content })
      git(['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`], { env })
      const tree = git(['write-tree'], { env })
      const sha = git(['commit-tree', tree, '-p', parent, '-m', 'other'], { env: { GIT_AUTHOR_NAME: 'other', GIT_AUTHOR_EMAIL: 'other@example.com', GIT_COMMITTER_NAME: 'other', GIT_COMMITTER_EMAIL: 'other@example.com' } })
      git(['update-ref', `refs/heads/${branch}`, sha])
      return sha
    },
    async close() {
      await new Promise(resolve => server.close(resolve))
      rmSync(root, { recursive: true, force: true })
    }
  }
}
