import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveSnapshotSha } from '../utils'
import type { InstanceSource } from '../../../server/utils/content/instances'

const SHA = (char: string) => char.repeat(40)

/** Answers the commits query with a sha per requested ref; a missing entry is a 404. */
function stubApi(bySha: Record<string, string>) {
  return vi.fn(async (url: string | URL) => {
    const ref = new URL(String(url)).searchParams.get('sha') ?? ''
    const answer = bySha[ref]
    if (!answer) return new Response('[]', { status: 404 })

    return new Response(JSON.stringify([{ sha: answer }]), { status: 200 })
  })
}

const source = (overrides: Partial<InstanceSource> = {}): InstanceSource => ({
  repo: 'owner/name',
  branch: 'main',
  contentDir: 'content',
  prefix: '/',
  ...overrides
})

describe('resolveSnapshotSha', () => {
  afterEach(() => vi.unstubAllGlobals())

  describe('a remote instance', () => {
    it('asks about the branch it reads', async () => {
      const fetchMock = stubApi({ '4.x': SHA('a') })
      vi.stubGlobal('fetch', fetchMock)

      const resolved = await resolveSnapshotSha({
        source: source({ branch: '4.x', contentDir: 'docs' }),
        repoRoot: '/nowhere'
      })

      expect(resolved).toBe(SHA('a'))
      const requested = new URL(String(fetchMock.mock.calls[0]![0])).searchParams
      expect(requested.get('sha')).toBe('4.x')
      expect(requested.get('path')).toBe('docs')
      expect(requested.get('per_page')).toBe('1')
    })

    it('ships nothing when the API cannot name the content', async () => {
      vi.stubGlobal('fetch', stubApi({}))

      expect(await resolveSnapshotSha({ source: source({ branch: '4.x' }), repoRoot: '/nowhere' })).toBeUndefined()
    })

    it('ships nothing rather than trusting a malformed answer', async () => {
      vi.stubGlobal('fetch', stubApi({ main: 'not-a-sha' }))

      expect(await resolveSnapshotSha({ source: source(), repoRoot: '/nowhere' })).toBeUndefined()
    })
  })

  describe('a local instance', () => {
    let repo: string
    let contentCommit: string
    let head: string

    const run = (...args: string[]) =>
      execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

    const write = async (file: string, body: string) => {
      await mkdir(dirname(join(repo, file)), { recursive: true })
      await writeFile(join(repo, file), body, 'utf8')
    }

    beforeEach(async () => {
      repo = await mkdtemp(join(tmpdir(), 'nuxt-com-snapshot-sha-'))
      run('init', '-q', '-b', 'main')
      run('config', 'user.email', 'test@example.com')
      run('config', 'user.name', 'Test')

      await write('content/index.md', '# one\n')
      run('add', '-A')
      run('commit', '-qm', 'add content')
      contentCommit = run('rev-parse', 'HEAD')

      // A later commit that leaves `content/` alone, so HEAD is not the last content commit.
      await write('app/app.vue', '<template><div /></template>\n')
      run('add', '-A')
      run('commit', '-qm', 'add app')
      head = run('rev-parse', 'HEAD')
    })

    afterEach(() => rm(repo, { recursive: true, force: true }))

    const local = () => ({ source: source({ local: true }), repoRoot: repo, token: 'tok' })

    it('walks from the built commit, not the branch', async () => {
      // Keeps a mid-build push, or a redeploy of an older commit, from mislabelling the snapshot.
      const fetchMock = stubApi({ [head]: contentCommit, main: SHA('f') })
      vi.stubGlobal('fetch', fetchMock)

      expect(await resolveSnapshotSha(local())).toBe(contentCommit)
      expect(new URL(String(fetchMock.mock.calls[0]![0])).searchParams.get('sha')).toBe(head)
    })

    it('falls back to a tree-verified git answer when the API fails', async () => {
      vi.stubGlobal('fetch', stubApi({}))

      // Full history here, so git finds the true commit and its content tree matches HEAD's.
      expect(await resolveSnapshotSha(local())).toBe(contentCommit)
    })

    it('ships nothing when neither the API nor git can name the content', async () => {
      vi.stubGlobal('fetch', stubApi({}))

      expect(await resolveSnapshotSha({
        ...local(),
        source: source({ local: true, contentDir: 'nope' })
      })).toBeUndefined()
    })

    it('warns on the git fallback when the answer is a shallow boundary', async () => {
      vi.stubGlobal('fetch', stubApi({}))
      const warn = vi.fn()

      // A one-commit repo: its only commit is parentless, which is what a depth-1 clone looks like.
      const shallow = await mkdtemp(join(tmpdir(), 'nuxt-com-shallow-'))
      try {
        const at = (...args: string[]) => execFileSync('git', args, { cwd: shallow, stdio: 'ignore' })
        at('init', '-q', '-b', 'main')
        at('config', 'user.email', 'test@example.com')
        at('config', 'user.name', 'Test')
        await mkdir(join(shallow, 'content'), { recursive: true })
        await writeFile(join(shallow, 'content/index.md'), '# one\n', 'utf8')
        at('add', '-A')
        at('commit', '-qm', 'init')

        expect(await resolveSnapshotSha({ ...local(), repoRoot: shallow, warn })).toMatch(/^[0-9a-f]{40}$/)
        expect(warn).toHaveBeenCalledOnce()
        expect(warn.mock.calls[0]![0]).toContain('shallow clone boundary')
      } finally {
        await rm(shallow, { recursive: true, force: true })
      }
    })
  })
})
