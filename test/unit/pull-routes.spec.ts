import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentInstanceKey } from '../../shared/utils/content'
import { instanceKeyFromSegments } from '../../server/utils/content/instances'

const PR_SHA = 'a'.repeat(40)
const HEAD_SHA = 'b'.repeat(40)

interface FakeEvent {
  params: Record<string, string>
  url?: string
}

/** The preview both routes resolve: `nuxt/nuxt#1`, targeting the 5.x docs. */
const preview = {
  target: { repo: 'nuxt', number: 1 },
  title: '',
  url: '',
  sha: PR_SHA,
  instanceKey: 'docs:5.x' as ContentInstanceKey,
  files: []
}

/** The request each instance's `handler()` receives, by key. */
const handled: Array<{ key: ContentInstanceKey, pathname: string }> = []
const instanceFor = (key: ContentInstanceKey) => ({
  handler: async (request: Request) => {
    handled.push({ key, pathname: new URL(request.url).pathname })
    return new Response('{}')
  }
})

/** The routes reach for these through Nitro's auto-imports. */
vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getRouterParam', (event: FakeEvent, name: string) => event.params[name])
vi.stubGlobal('toWebRequest', (event: FakeEvent) => new Request(`http://localhost${event.url}`))
vi.stubGlobal('pullTargetFromEvent', () => preview.target)
vi.stubGlobal('resolvePullPreview', async () => preview)
vi.stubGlobal('instanceKeyFromSegments', instanceKeyFromSegments)
vi.stubGlobal('getInstanceAtPull', async (key: ContentInstanceKey) => instanceFor(key))

type Handler = (event: FakeEvent) => Promise<unknown>
const headRoute = (await import('../../server/api/content/pull/[repo]/[number]/head.get')).default as unknown as Handler
const blobRoute = (await import('../../server/api/content/pull/[repo]/[number]/blob/[sha]/[...path].get')).default as unknown as Handler

beforeEach(() => {
  handled.length = 0
})

describe('GET /api/content/pull/:repo/:number/head', () => {
  it('names the instance the PR replaces and its commit', async () => {
    expect(await headRoute({ params: {} })).toEqual({ instanceKey: 'docs:5.x', sha: PR_SHA })
  })
})

describe('GET /api/content/pull/:repo/:number/blob/:sha/...', () => {
  const blob = (sha: string, path: string) => blobRoute({
    params: { sha, path },
    url: `/api/content/pull/nuxt/1/blob/${sha}/${path}`
  })

  it('serves a targeted instance at the PR\'s commit, under the instance\'s own base path', async () => {
    await blob(PR_SHA, 'docs/5.x/manifest.json')

    expect(handled).toEqual([{ key: 'docs:5.x', pathname: '/api/content/docs/5.x/manifest.json' }])
  })

  it('404s another commit or another instance, which would otherwise be cached forever', async () => {
    await expect(blob(HEAD_SHA, 'docs/5.x/manifest.json')).rejects.toMatchObject({ statusCode: 404 })
    await expect(blob(PR_SHA, 'docs/4.x/manifest.json')).rejects.toMatchObject({ statusCode: 404 })
    expect(handled).toEqual([])
  })

  it('rejects a malformed commit before resolving anything', async () => {
    await expect(blob('not-a-sha', 'docs/5.x/manifest.json')).rejects.toMatchObject({ statusCode: 400 })
  })
})
