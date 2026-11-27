import { describe, expect, it, vi } from 'vitest'

/**
 * `impactedInstances`/`changesForSource` live in `server/utils/content/`, where Nitro auto-imports
 * `instanceSource`. Vitest has no auto-imports, so the module is loaded with that binding stubbed
 * on `globalThis` — the same shape `instances.ts` exports.
 */
const instanceSource = (key: string) => {
  if (key === 'site') {
    return { name: 'site', source: { repo: 'nuxt/nuxt.com', branch: 'main', contentDir: 'content', prefix: '/' } }
  }
  if (key === 'examples') {
    return { name: 'examples', source: { repo: 'nuxt/examples', branch: 'main', contentDir: '.docs/', prefix: '/docs/examples' } }
  }
  if (key.startsWith('cli:')) {
    const version = key.slice('cli:'.length)
    return {
      name: 'cli',
      source: {
        // 3.x and 4.x both pin the released CLI; 5.x follows `main`.
        repo: 'nuxt/cli',
        branch: version === '5.x' ? 'main' : '3.x',
        contentDir: 'docs',
        prefix: `/docs/${version}/api/commands`
      }
    }
  }
  if (key.startsWith('module-builder:')) {
    const version = key.slice('module-builder:'.length)
    return {
      name: 'module_builder',
      source: { repo: 'nuxt/module-builder', branch: 'main', contentDir: 'docs', prefix: `/docs/${version}/api/module-builder` }
    }
  }
  if (key.startsWith('build-module:')) {
    const version = key.slice('build-module:'.length)
    return {
      name: 'build_module',
      source: { repo: 'nuxt/module-builder', branch: 'main', contentDir: 'docs/cli/build-module', prefix: `/docs/${version}/api/commands/build-module` }
    }
  }

  const version = key.slice('docs:'.length)
  return {
    name: 'docs',
    source: {
      repo: 'nuxt/nuxt',
      branch: version === '5.x' ? 'main' : version,
      contentDir: 'docs',
      prefix: `/docs/${version}`
    }
  }
}

vi.stubGlobal('instanceSource', instanceSource)

const { changesForSource, impactedInstances, payloadUrlForPage } = await import('../../server/utils/content/webhook')

describe('impactedInstances', () => {
  it('maps each content repo/branch to the instances reading it', () => {
    expect(impactedInstances('nuxt/nuxt.com', 'main')).toEqual(['site'])
    expect(impactedInstances('nuxt/examples', 'main')).toEqual(['examples'])
    expect(impactedInstances('nuxt/nuxt', '2.x')).toEqual(['docs:2.x'])
    expect(impactedInstances('nuxt/nuxt', '4.x')).toEqual(['docs:4.x'])
    expect(impactedInstances('nuxt/nuxt', 'main')).toEqual(['docs:5.x'])
  })

  it('fans a `nuxt/cli` push out to every version pinning that ref', () => {
    // The regression this guards: 3.x and 4.x share the released CLI, so one push has to purge both.
    expect(impactedInstances('nuxt/cli', '3.x')).toEqual(['cli:3.x', 'cli:4.x'])
    expect(impactedInstances('nuxt/cli', 'main')).toEqual(['cli:5.x'])
  })

  it('fans a `nuxt/module-builder` push out to every version that mounts it', () => {
    expect(impactedInstances('nuxt/module-builder', 'main')).toEqual([
      'module-builder:3.x',
      'module-builder:4.x',
      'module-builder:5.x',
      'build-module:3.x',
      'build-module:4.x',
      'build-module:5.x'
    ])
  })

  it('ignores refs no source reads', () => {
    expect(impactedInstances('nuxt/nuxt', 'some-feature-branch')).toEqual([])
    expect(impactedInstances('nuxt/ui', 'main')).toEqual([])
  })
})

describe('changesForSource', () => {
  it('returns manifest keys, letting comark own file → URL resolution', () => {
    const changes = changesForSource('docs', 'docs', [
      { added: ['docs/1.getting-started/01.introduction.md'], modified: ['docs/4.api/1.components/1.client-only.md'] }
    ])

    expect(changes.upserted).toEqual([
      'docs/1.getting-started/01.introduction.md',
      'docs/4.api/1.components/1.client-only.md'
    ])
    expect(changes.removed).toEqual([])
    expect(changes.navTouched).toBe(false)
  })

  it('keys a cli push under the `cli` source, not the repo directory', () => {
    // Both sources read a directory called `docs`; only the source name disambiguates them.
    expect(changesForSource('cli', 'docs', [{ modified: ['docs/dev.md'] }]).upserted).toEqual(['cli/dev.md'])
    expect(changesForSource('module_builder', 'docs', [{ modified: ['docs/2.commands.md', 'src/cli.ts'] }]).upserted).toEqual(['module_builder/2.commands.md'])
    expect(changesForSource('build_module', 'docs/cli/build-module', [{ modified: ['docs/2.commands.md', 'docs/cli/build-module/index.md'] }]).upserted).toEqual(['build_module/index.md'])
  })

  it('ignores files outside the content directory and non-content extensions', () => {
    const changes = changesForSource('docs', 'docs', [
      { modified: ['packages/nuxt/src/index.ts', 'README.md', 'docs/image.png'] }
    ])

    expect(changes).toEqual({ upserted: [], removed: [], navTouched: false })
  })

  it('flags navigation config separately from pages', () => {
    const changes = changesForSource('docs', 'docs', [{ modified: ['docs/3.guide/.navigation.yml'] }])

    expect(changes.navTouched).toBe(true)
    expect(changes.upserted).toEqual([])
  })

  it('collapses a file touched across several commits of one push', () => {
    const changes = changesForSource('docs', 'docs', [
      { added: ['docs/2.guide/new.md'] },
      { modified: ['docs/2.guide/new.md'] }
    ])

    expect(changes.upserted).toEqual(['docs/2.guide/new.md'])
  })

  it('treats a removed-then-re-added path as an upsert', () => {
    const changes = changesForSource('docs', 'docs', [
      { removed: ['docs/2.guide/moved.md'] },
      { added: ['docs/2.guide/moved.md'] }
    ])

    expect(changes.upserted).toEqual(['docs/2.guide/moved.md'])
    expect(changes.removed).toEqual([])
  })

  it('reports removals, whose URLs only the previous manifest knows', () => {
    const changes = changesForSource('docs', 'docs', [{ removed: ['docs/2.guide/gone.md'] }])

    expect(changes.removed).toEqual(['docs/2.guide/gone.md'])
    expect(changes.upserted).toEqual([])
  })
})

describe('payloadUrlForPage', () => {
  it('matches the URL Nuxt requests on client-side navigation', () => {
    // `experimental.payloadExtraction` is on, so this is a second ISR entry per page. If the shape
    // drifts from Nuxt's, purges silently miss it and in-app navigation serves stale content.
    expect(payloadUrlForPage('/docs/4.x/getting-started/introduction', 'abc123'))
      .toBe('/docs/4.x/getting-started/introduction/_payload.json?_b=abc123')
    expect(payloadUrlForPage('/', 'abc123')).toBe('/_payload.json?_b=abc123')
  })

  it('omits the build id when there is none', () => {
    expect(payloadUrlForPage('/blog/v4', '')).toBe('/blog/v4/_payload.json')
  })
})
