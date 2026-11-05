import { afterEach, describe, expect, it, vi } from 'vitest'
import { discoverShowcaseCandidates } from '../../layers/nuxi/agent/lib/showcase/discovery'

const now = new Date('2026-11-03T12:00:00Z')
const recent = now.getTime() - 86_400_000

function hit(domain: string, extra: Record<string, unknown> = {}) {
  return {
    domain,
    scannedAt: recent,
    title: domain,
    finalUrl: `https://${domain}/`,
    version: '4.4.2',
    confidence: 31,
    rank: null,
    signals: [{ name: 'script#__NUXT_DATA__', weight: 5 }],
    image: { nsfwLabel: 'safe' },
    ...extra
  }
}

function feed(hits: ReturnType<typeof hit>[], extra: Record<string, unknown> = {}) {
  return { page: 1, pageCount: 1, sort: 'scanned_at', order: 'desc', hits, ...extra }
}

afterEach(() => vi.unstubAllGlobals())

describe('showcase discovery', () => {
  it('excludes existing/redirected/www hosts, duplicates, older scans, unsafe labels and invalid URLs', async () => {
    const mock = vi.fn(async (_url: URL) => Response.json(feed([
      hit('www.existing.com'),
      hit('redirect.com', { finalUrl: 'https://existing.com/docs' }),
      hit('new.com'),
      hit('www.new.com'),
      hit('alias.com', { finalUrl: 'https://new.com' }),
      hit('old.com', { scannedAt: recent - 7 * 86_400_000 }),
      hit('future.com', { scannedAt: now.getTime() + 86_400_000 }),
      hit('unsafe.com', { image: { nsfwLabel: 'nsfw' } }),
      hit('unknown.com', { image: { nsfwLabel: null } }),
      hit('localhost'),
      hit('127.0.0.1'),
      hit('bad.com', { finalUrl: 'javascript:alert(1)' }),
      hit('credentials.com', { finalUrl: 'https://user:pass@new.com' }),
      hit('ranked.com', { rank: 1200 })
    ])))
    vi.stubGlobal('fetch', mock)

    const result = await discoverShowcaseCandidates({ websites: [{ name: 'Existing', url: 'https://existing.com' }], now })

    expect(result.candidates.map(candidate => candidate.domain)).toEqual(['ranked.com', 'new.com'])
    expect(result.candidates[1]).toMatchObject({ version: '4.4.2', signals: ['script#__NUXT_DATA__'], evidenceUrl: 'https://nuxt.fyi/hits/new.com' })
    expect(result.coverage).toMatchObject({ partial: false, eligible: 2 })
    // Never fetch candidate websites: only the fixed discovery API.
    expect(mock).toHaveBeenCalledTimes(1)
    expect(String(mock.mock.calls[0]![0])).toBe('https://nuxt.fyi/api/hits?page=1&sort=scanned_at&order=desc')
  })

  it('bounds pagination, ranks across pages, and discloses omitted candidates and partial coverage', async () => {
    const mock = vi.fn(async (url: URL) => {
      const page = Number(url.searchParams.get('page'))
      return Response.json(feed([hit(`page${page}.com`, { rank: 4 - page })], { page, pageCount: 10 }))
    })
    vi.stubGlobal('fetch', mock)

    const result = await discoverShowcaseCandidates({ websites: [], now, limit: 1 })

    expect(mock).toHaveBeenCalledTimes(3)
    expect(result.candidates[0]?.domain).toBe('page3.com')
    expect(result.coverage).toEqual({ pagesRead: 3, scanned: 3, eligible: 3, partial: true, omitted: 2 })
    expect(result.warnings[0]).toContain('more candidates may exist')
  })

  it('does not silently repeat a page when the live API ignores pagination', async () => {
    const mock = vi.fn(async () => Response.json(feed([hit('new.com')], { pageCount: 100 })))
    vi.stubGlobal('fetch', mock)

    const result = await discoverShowcaseCandidates({ websites: [], now })

    expect(mock).toHaveBeenCalledTimes(2)
    expect(result.candidates).toHaveLength(1)
    expect(result.coverage).toMatchObject({ partial: true, pagesRead: 1 })
    expect(result.warnings[0]).toContain('did not honor')
  })

  it('stops at the window boundary and includes its exact cutoff', async () => {
    const cutoff = now.getTime() - 7 * 86_400_000
    const mock = vi.fn(async () => Response.json(feed([
      hit('boundary.com', { scannedAt: cutoff }),
      hit('older.com', { scannedAt: cutoff - 1 })
    ], { pageCount: 100 })))
    vi.stubGlobal('fetch', mock)

    const result = await discoverShowcaseCandidates({ websites: [], now })
    expect(mock).toHaveBeenCalledTimes(1)
    expect(result.candidates.map(candidate => candidate.domain)).toEqual(['boundary.com'])
    expect(result.coverage.partial).toBe(false)
  })

  it('surfaces HTTP/schema failures instead of reporting an empty shortlist', async () => {
    const mock = vi.fn(async () => new Response('Unavailable', { status: 503 }))
    vi.stubGlobal('fetch', mock)
    await expect(discoverShowcaseCandidates({ websites: [], now })).rejects.toThrow('HTTP 503')
    mock.mockImplementation(async () => Response.json({ rows: [] }))
    await expect(discoverShowcaseCandidates({ websites: [], now })).rejects.toThrow()
  })

  it('passes caller cancellation through to the feed request', async () => {
    const controller = new AbortController()
    const mock = vi.fn(async (_url: URL, options: RequestInit) => {
      controller.abort()
      options.signal!.throwIfAborted()
      return Response.json(feed([]))
    })
    vi.stubGlobal('fetch', mock)
    await expect(discoverShowcaseCandidates({ websites: [], now, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })
})
