import { execFile, execFileSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { followCommit, MAX_CHANGE_BYTES, readStagedChanges, type CloneSandbox } from '../../layers/nuxi/agent/lib/clone'
import { commitChanges } from '../../layers/nuxi/agent/lib/github-files'

/** No signing, no hooks and no identity from the machine that runs the tests. */
const GIT_ENV = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com'
}

function bash(command: string, cwd: string) {
  return new Promise<{ exitCode: number, stdout: string, stderr: string }>((resolve) => {
    execFile('bash', ['-c', command], { cwd, env: { ...process.env, ...GIT_ENV }, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout, stderr })
    })
  })
}

async function sh(command: string, cwd: string): Promise<string> {
  const result = await bash(command, cwd)
  if (result.exitCode !== 0) throw new Error(`${command}: ${result.stderr || result.stdout}`)
  return result.stdout.trim()
}

/**
 * GitHub's API for `acme/app`, answered by git itself in the repository at `origin`: a commit made
 * through it is a real commit there, with the tree and the parents git gives it. `calls` lists
 * every request, and `pullRequests` the branches that have an open pull request.
 */
function githubOf(origin: string, pullRequests: string[] = []) {
  const calls: string[] = []
  let indexes = 0
  const git = (args: string[], options: { input?: Buffer, index?: string } = {}) => execFileSync('git', args, {
    cwd: origin,
    input: options.input,
    stdio: ['pipe', 'pipe', 'ignore'],
    env: { ...process.env, ...GIT_ENV, ...(options.index && { GIT_INDEX_FILE: options.index }) }
  }).toString().trim()
  const attempt = (args: string[]) => {
    try {
      return git(args)
    } catch {
      return undefined
    }
  }
  const headOf = (branch: string) => attempt(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])
  const hasCommit = (sha: string) => attempt(['cat-file', '-e', `${sha}^{commit}`]) !== undefined
  const blob = (base64: string) => git(['hash-object', '-w', '--stdin'], { input: Buffer.from(base64, 'base64') })
  /** `base` with each entry written over it, or removed from it when it has no `sha`. */
  function tree(base: string, entries: Array<{ path: string, mode: string, sha: string | null }>) {
    const index = join(origin, '.git', `api-index-${indexes++}`)
    git(['read-tree', base], { index })
    for (const { path, mode, sha } of entries) {
      git(sha === null ? ['update-index', '--force-remove', path] : ['update-index', '--add', '--cacheinfo', `${mode},${sha},${path}`], { index })
    }
    return git(['write-tree'], { index })
  }

  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    const method = init?.method ?? 'GET'
    const path = url.pathname.replace('/repos/acme/app', '')
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push(`${method} ${path}`)
    const fail = (status: number, message: string) => Response.json({ message }, { status })

    if (method === 'GET' && path === '') return Response.json({ default_branch: 'main' })
    if (method === 'GET' && path === '/pulls') return Response.json(pullRequests.some(branch => url.searchParams.get('head') === `acme:${branch}`) ? [{ number: 7 }] : [])
    if (method === 'GET' && path.startsWith('/git/ref/heads/')) {
      const sha = headOf(path.slice('/git/ref/heads/'.length))
      return sha ? Response.json({ object: { sha } }) : fail(404, 'Not Found')
    }
    if (method === 'POST' && path === '/git/refs') {
      if (!hasCommit(body.sha)) return fail(422, 'Object does not exist')
      git(['update-ref', body.ref, body.sha])
      return Response.json({})
    }
    if (method === 'PATCH' && path.startsWith('/git/refs/heads/')) {
      const ref = path.slice('/git/'.length)
      if (body.force !== false || attempt(['merge-base', '--is-ancestor', ref, body.sha]) === undefined) return fail(422, 'Update is not a fast forward')
      git(['update-ref', ref, body.sha])
      return Response.json({})
    }
    if (method === 'GET' && path.startsWith('/git/commits/')) return Response.json({ tree: { sha: git(['rev-parse', `${path.slice('/git/commits/'.length)}^{tree}`]) } })
    if (method === 'POST' && path === '/git/blobs') return Response.json({ sha: blob(body.content) })
    if (method === 'POST' && path === '/git/trees') return Response.json({ sha: tree(body.base_tree, body.tree) })
    if (method === 'POST' && path === '/git/commits') {
      if (!body.parents.every(hasCommit)) return fail(422, 'Parent does not exist')
      const sha = git(['commit-tree', body.tree, ...body.parents.flatMap((parent: string) => ['-p', parent]), '-m', body.message])
      return Response.json({ sha, html_url: `https://github.com/acme/app/commit/${sha}` })
    }
    if (method === 'POST' && path === '/graphql') {
      const { branch: { branchName }, expectedHeadOid, message, fileChanges } = body.variables.input
      if (headOf(branchName) !== expectedHeadOid) return Response.json({ errors: [{ message: `Expected branch to point to "${expectedHeadOid}"` }] })
      const written = tree(expectedHeadOid, [
        ...fileChanges.additions.map((file: { path: string, contents: string }) => ({ path: file.path, mode: '100644', sha: blob(file.contents) })),
        ...(fileChanges.deletions ?? []).map((file: { path: string }) => ({ path: file.path, mode: '100644', sha: null }))
      ])
      const sha = git(['commit-tree', written, '-p', expectedHeadOid, '-m', [message.headline, message.body].filter(Boolean).join('\n\n')])
      git(['update-ref', `refs/heads/${branchName}`, sha])
      return Response.json({ data: { createCommitOnBranch: { commit: { oid: sha, url: `https://github.com/acme/app/commit/${sha}` } } } })
    }
    return fail(404, 'Not Found')
  }) as typeof fetch

  return { fetchImpl, calls }
}

const BINARY = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x00, 0xFF, 0x0D, 0x0A, 0x00])

describe('a clone in the coder\'s sandbox', () => {
  let root: string
  /** Stands for GitHub: what `https://github.com/acme/app` answers with, and where a commit made through the API lands. */
  let origin: string
  /** The clone, as the coder's `git clone https://github.com/acme/app` leaves it. */
  let directory: string
  const repository = 'acme/app'
  /** Real git and real directories. */
  const sandbox: CloneSandbox = {
    run: ({ command, workingDirectory }) => bash(command, workingDirectory ?? root),
    readBinaryFile: ({ path }) => readFile(path).then(bytes => new Uint8Array(bytes), () => null)
  }

  async function write(path: string, content: string | Uint8Array) {
    await mkdir(dirname(join(directory, path)), { recursive: true })
    await writeFile(join(directory, path), content)
  }

  const git = (command: string) => sh(`git ${command}`, directory)
  const onGithub = (command: string) => sh(`git ${command}`, origin)
  const staged = (override: { repository?: string, directory?: string } = {}) => readStagedChanges({ sandbox, repository, directory, ...override })
  const text = (bytes: Uint8Array) => Buffer.from(bytes).toString()

  /** What `commit_changes` does: read what is staged, commit it through GitHub's API, and put the clone on that commit. */
  async function commit(github: ReturnType<typeof githubOf>, branch: string, message = 'fix: change') {
    const made = await commitChanges({ repository, token: 'token', fetchImpl: github.fetchImpl, branch, message, ...await staged() })
    await followCommit({ sandbox, directory, branch, commit: made.commitSha })
    return made
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'nuxi-clone-test-'))
    origin = join(root, 'origin')
    directory = join(root, 'repos', repository)
    await mkdir(join(origin, 'app/pages'), { recursive: true })
    await writeFile(join(origin, '.gitignore'), 'node_modules\n.output\n')
    await writeFile(join(origin, 'README.md'), '# App\n')
    await writeFile(join(origin, 'package.json'), '{\n  "dependencies": {\n    "nuxt": "4.0.0"\n  }\n}\n')
    await writeFile(join(origin, 'app/pages/index.vue'), '<template>Home</template>\n')
    await writeFile(join(origin, 'app/pages/old.vue'), '<template>Old</template>\n')
    await writeFile(join(origin, 'run.sh'), '#!/bin/sh\n')
    await chmod(join(origin, 'run.sh'), 0o755)
    await sh('git init --quiet --initial-branch=main && git add --all && git commit --quiet -m init', origin)
    await sh(`git clone --quiet ${origin} ${directory}`, root)
    await git(`config url.${origin}.insteadOf https://github.com/${repository}`)
    await git(`config remote.origin.url https://github.com/${repository}`)
  })
  afterEach(() => rm(root, { recursive: true, force: true }))

  it('reads what was staged, added, modified or deleted, and nothing else', async () => {
    await write('app/pages/index.vue', '<template>New home</template>\n')
    await write('app/pages/[slug] copy.vue', '<template>Slug</template>\n')
    await write('app/assets/logo.png', BINARY)
    await rm(join(directory, 'app/pages/old.vue'))
    await write('README.md', '# Left out\n')
    await write('node_modules/pkg/index.js', 'ignored')
    await git('add --all app')

    const read = await staged()

    expect(read.parents).toEqual([await git('rev-parse HEAD')])
    expect(read.inherited).toEqual([])
    expect(read.deletions).toEqual(['app/pages/old.vue'])
    expect(Object.fromEntries(read.files.map(file => [file.path, file.bytes]))).toEqual({
      'app/assets/logo.png': BINARY,
      'app/pages/[slug] copy.vue': new Uint8Array(Buffer.from('<template>Slug</template>\n')),
      'app/pages/index.vue': new Uint8Array(Buffer.from('<template>New home</template>\n'))
    })
  })

  it('reads a file as it was staged, whatever was written to it since', async () => {
    await write('README.md', '# Staged\n')
    await git('add README.md')
    await write('README.md', '# Still being written')

    expect((await staged()).files.map(file => [file.path, text(file.bytes)])).toEqual([['README.md', '# Staged\n']])
  })

  it.each([
    ['nothing is staged', () => write('README.md', '# Not staged\n'), 'Nothing is staged'],
    ['an executable file is staged', () => write('run.sh', '#!/bin/sh\necho hi\n'), '"run.sh" is an executable file'],
    ['a symbolic link is staged', () => symlink('README.md', join(directory, 'link.md')), '"link.md" is a symbolic link'],
    ['the staged files weigh more than a commit holds', () => write('big.bin', new Uint8Array(MAX_CHANGE_BYTES + 1)), 'a commit holds 10 MB at most']
  ])('refuses when %s', async (name, change, message) => {
    await change()
    if (name !== 'nothing is staged') await git('add --all')

    await expect(staged()).rejects.toThrow(message)
  })

  it('refuses a directory that is not the root of a clone of that repository', async () => {
    await write('README.md', '# Changed\n')
    await git('add --all')

    await expect(staged({ repository: 'acme/other' })).rejects.toThrow(`is a clone of https://github.com/acme/app, not of acme/other`)
    await expect(staged({ directory: join(directory, 'app') })).rejects.toThrow('is not the root of a clone')
    await expect(staged({ directory: root })).rejects.toThrow('is not the root of a clone')
    await expect(staged({ directory: join(root, 'missing') })).rejects.toThrow('is not the root of a clone')
  })

  it('commits what was staged to a new `nuxi/*` branch, then only what is staged since', async () => {
    const github = githubOf(origin)
    const cloned = await git('rev-parse HEAD')
    await write('app/pages/index.vue', '<template>New home</template>\n')
    await write('app/assets/logo.png', BINARY)
    await rm(join(directory, 'app/pages/old.vue'))
    await write('README.md', '# Left out\n')
    await git('add --all app')
    const index = await git('write-tree')

    const first = await commit(github, 'nuxi/home', 'feat(home): new home\n\nWith a logo.')

    expect(first).toEqual({
      repository,
      branch: 'nuxi/home',
      createdBranch: true,
      commitSha: await onGithub('rev-parse nuxi/home'),
      commitUrl: `https://github.com/acme/app/commit/${first.commitSha}`,
      paths: ['app/assets/logo.png', 'app/pages/index.vue'],
      deleted: ['app/pages/old.vue']
    })
    // The commit on GitHub holds the files exactly as git staged them, on top of the cloned commit.
    expect(await onGithub(`rev-parse ${first.commitSha}^{tree}`)).toBe(index)
    expect(await onGithub(`rev-list --parents -n 1 ${first.commitSha}`)).toBe(`${first.commitSha} ${cloned}`)
    expect(await onGithub(`log -1 --format=%B ${first.commitSha}`)).toBe('feat(home): new home\n\nWith a logo.')
    expect(await onGithub('rev-parse main')).toBe(cloned)

    // The clone is on that branch at that commit, with what was left out still there to read.
    expect(await git('rev-parse HEAD')).toBe(first.commitSha)
    expect(await git('rev-parse --abbrev-ref HEAD')).toBe('nuxi/home')
    expect(await git('rev-parse main')).toBe(cloned)
    expect(await sh('git status --porcelain', directory)).toBe('M README.md')
    await expect(staged()).rejects.toThrow('Nothing is staged')

    await git('add README.md')
    const second = await commit(github, 'nuxi/home')

    expect(second).toMatchObject({ createdBranch: false, paths: ['README.md'], deleted: [] })
    expect(await onGithub(`rev-list --parents -n 1 ${second.commitSha}`)).toBe(`${second.commitSha} ${first.commitSha}`)
    expect(await sh('git status --porcelain', directory)).toBe('')
  })

  it('resolves the conflict of an open pull request with a merge commit on its branch', async () => {
    // A dependency update, and a default branch that moved on since: the same line of
    // `package.json`, a file it deleted, a file it changed and an executable file it added.
    await sh('git checkout --quiet -b renovate/nuxt && sed -i s/4.0.0/5.0.0/ package.json && echo nuxt@5 > lock.txt && git add --all && git commit --quiet -m bump', origin)
    await sh('git checkout --quiet main && sed -i s/4.0.0/4.1.0/ package.json && git rm --quiet app/pages/old.vue && echo "# App 2" > README.md && mkdir scripts && cp run.sh scripts/build.sh && git add --all && git commit --quiet -m move', origin)
    const [theirs, mainHead] = [await onGithub('rev-parse renovate/nuxt'), await onGithub('rev-parse main')]
    const github = githubOf(origin, ['renovate/nuxt'])

    await git('fetch --quiet origin')
    await git('checkout --quiet -B renovate/nuxt origin/renovate/nuxt')
    expect((await bash('git merge --no-commit --no-ff origin/main', directory)).exitCode).toBe(1)
    await expect(staged()).rejects.toThrow('"package.json" still has a merge conflict')

    // Neither side's line, so the file is in neither commit.
    await write('package.json', '{\n  "dependencies": {\n    "nuxt": "5.0.1"\n  }\n}\n')
    await git('add package.json')
    const index = await git('write-tree')
    const merge = await commit(github, 'renovate/nuxt', 'chore: merge main into renovate/nuxt')

    // One commit on the pull request's branch, with both parents and the tree git staged.
    expect(await onGithub('rev-parse renovate/nuxt')).toBe(merge.commitSha)
    expect(await onGithub(`rev-list --parents -n 1 ${merge.commitSha}`)).toBe(`${merge.commitSha} ${theirs} ${mainHead}`)
    expect(await onGithub(`rev-parse ${merge.commitSha}^{tree}`)).toBe(index)
    expect(await onGithub(`ls-tree ${merge.commitSha} scripts/build.sh`)).toMatch(/^100755 blob /)
    expect(await onGithub('rev-parse main')).toBe(mainHead)
    // Only the resolved file is sent: GitHub has the files of the merged commit.
    expect(merge).toMatchObject({ createdBranch: false, paths: ['package.json'], deleted: ['app/pages/old.vue'] })
    expect(github.calls.filter(call => call === 'POST /git/blobs')).toHaveLength(1)

    // The merge is over in the clone too.
    expect(await git('rev-parse HEAD')).toBe(merge.commitSha)
    expect(await sh('git status --porcelain', directory)).toBe('')
    expect((await bash('git rev-parse --verify --quiet MERGE_HEAD', directory)).exitCode).not.toBe(0)
  })

  it.each([
    ['the default branch', 'main', '`main` is the default branch of acme/app'],
    ['a branch that is neither `nuxi/*` nor the branch of an open pull request', 'v3', '`v3` is not a `nuxi/*` branch and has no open pull request'],
    ['a new branch outside `nuxi/*`', 'feat/home', 'has no open pull request'],
    ['a branch name that climbs', 'nuxi/../main', 'is not a branch name this tool takes'],
    ['a branch name that is a path of the API', 'nuxi/x?ref=main', 'is not a branch name this tool takes']
  ])('writes nothing to %s', async (_, branch, message) => {
    await onGithub('branch v3')
    const github = githubOf(origin, ['renovate/nuxt'])
    await write('README.md', '# Changed\n')
    await git('add README.md')

    await expect(commit(github, branch)).rejects.toThrow(message)
    expect(github.calls.filter(call => !call.startsWith('GET '))).toEqual([])
    expect(await onGithub('rev-parse v3')).toBe(await onGithub('rev-parse main'))
  })

  it('writes nothing to a branch that is not at the commit the clone is at, where whole files would undo its commits', async () => {
    await sh('git checkout --quiet -b nuxi/home && echo "# Theirs" > README.md && git commit --quiet -am theirs && git checkout --quiet main', origin)
    const head = await onGithub('rev-parse nuxi/home')
    const github = githubOf(origin)
    await write('app/pages/index.vue', '<template>New home</template>\n')
    await git('add --all')

    await expect(commit(github, 'nuxi/home')).rejects.toThrow(`\`nuxi/home\` is at ${head.slice(0, 8)} on GitHub, and the clone is at ${(await git('rev-parse HEAD')).slice(0, 8)}. Nothing was committed.`)
    expect(github.calls.filter(call => !call.startsWith('GET '))).toEqual([])
    expect(await onGithub('rev-parse nuxi/home')).toBe(head)
  })

  it('says what to undo when the clone is at a commit made in the sandbox, which GitHub does not have', async () => {
    const github = githubOf(origin)
    await write('README.md', '# Committed in the sandbox\n')
    await sh('git commit --quiet -am local', directory)
    await write('app/pages/index.vue', '<template>New home</template>\n')
    await git('add --all')

    await expect(commit(github, 'nuxi/home')).rejects.toThrow('Nothing was committed. GitHub must have the commit the clone is at')
    expect(await bash('git rev-parse --verify --quiet refs/heads/nuxi/home', origin)).toMatchObject({ exitCode: 1 })
  })

  it('does not follow a branch that is not at the new commit', async () => {
    const cloned = await git('rev-parse HEAD')
    await onGithub('branch nuxi/elsewhere')

    await expect(followCommit({ sandbox, directory, branch: 'nuxi/elsewhere', commit: 'f'.repeat(40) })).rejects.toThrow('not at the new commit')
    expect(await git('rev-parse HEAD')).toBe(cloned)
    expect(await git('rev-parse --abbrev-ref HEAD')).toBe('main')
  })
})
