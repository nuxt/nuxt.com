import { generateNavigation } from 'comark-content/utils'
import { describe, expect, it } from 'vitest'
import { dottedFrontmatter, hoistNavigationPrefix, unflattenDotted } from '../../server/utils/content/dotted-frontmatter'

/** Minimal `ContentFile` for `file:parsed` — only what `dottedFrontmatter()` reads. */
function file(stem: string, data: Record<string, unknown>, extension = '.md') {
  return { path: `/${stem}`, data, meta: { key: stem, source: 'docs', stem, extension, kind: 'document' as const, type: '', partial: false }, nodes: [] }
}

describe('unflattenDotted', () => {
  it('expands a dotted key into a nested object', () => {
    expect(unflattenDotted({ 'title': 'Nuxt Config', 'navigation.icon': 'i-lucide-cog' }))
      .toEqual({ title: 'Nuxt Config', navigation: { icon: 'i-lucide-cog' } })
  })

  it('merges siblings expanded under the same parent', () => {
    expect(unflattenDotted({ 'navigation.icon': 'i-lucide-cog', 'navigation.title': 'Config' }))
      .toEqual({ navigation: { icon: 'i-lucide-cog', title: 'Config' } })
  })

  it('lets an explicit undotted value win over dotted shorthand', () => {
    expect(unflattenDotted({ 'navigation': { icon: 'explicit' }, 'navigation.icon': 'shorthand' }))
      .toEqual({ navigation: { icon: 'explicit' } })
  })

  it('drops a dotted key when an intermediate segment is a scalar (navigation: false wins)', () => {
    expect(unflattenDotted({ 'navigation': false, 'navigation.icon': 'i-lucide-cog' }))
      .toEqual({ navigation: false })
  })

  it('drops a dotted key when an intermediate segment is an array', () => {
    expect(unflattenDotted({ 'navigation': [], 'navigation.icon': 'i-lucide-cog' }))
      .toEqual({ navigation: [] })
  })

  it('leaves untouched keys without dots alone', () => {
    expect(unflattenDotted({ title: 'Utils', icon: 'i-lucide-square-function' }))
      .toEqual({ title: 'Utils', icon: 'i-lucide-square-function' })
  })
})

describe('hoistNavigationPrefix', () => {
  it('promotes navigation.* to the top level, for a .navigation.yml directory config', () => {
    expect(hoistNavigationPrefix({ 'title': 'Utils', 'titleTemplate': '%s · Nuxt Utils', 'navigation.icon': 'i-lucide-square-function' }))
      .toEqual({ title: 'Utils', titleTemplate: '%s · Nuxt Utils', icon: 'i-lucide-square-function' })
  })

  it('lets an explicit undotted field win over the hoisted one', () => {
    expect(hoistNavigationPrefix({ 'icon': 'explicit', 'navigation.icon': 'shorthand' }))
      .toEqual({ icon: 'explicit' })
  })

  it('leaves an unrelated navigation: false untouched', () => {
    expect(hoistNavigationPrefix({ icon: 'i-lucide-triangle-alert', navigation: false }))
      .toEqual({ icon: 'i-lucide-triangle-alert', navigation: false })
  })
})

describe('dottedFrontmatter() plugin', () => {
  function setupPlugin() {
    const hooks = new Map<string, Array<(ctx: any) => void>>()
    const listingFields: Array<{ extensions: string[], fields: string[] }> = []
    const content = {
      addListingFields: (extensions: `.${string}`[], fields: string[]) => listingFields.push({ extensions, fields }),
      hooks: { hook: (name: string, fn: (ctx: any) => void) => (hooks.get(name) ?? hooks.set(name, []).get(name)!).push(fn) }
    }
    dottedFrontmatter().setup!(content as any)
    return { listingFields, fireFileParsed: (ctx: any) => hooks.get('file:parsed')!.forEach(fn => fn(ctx)) }
  }

  it('registers the dotted fields as listing fields for md, markdown, yml and yaml', () => {
    const { listingFields } = setupPlugin()
    expect(listingFields).toEqual([
      { extensions: ['.md', '.markdown', '.yml', '.yaml'], fields: ['navigation.icon', 'navigation.title'] }
    ])
  })

  it('unflattens a dotted key on a regular markdown page', () => {
    const { fireFileParsed } = setupPlugin()
    const ctx = { file: file('4.api/6.nuxt-config', { 'title': 'Nuxt Config', 'navigation.icon': 'i-lucide-cog' }) }

    fireFileParsed(ctx)

    expect(ctx.file.data).toEqual({ title: 'Nuxt Config', navigation: { icon: 'i-lucide-cog' } })
  })

  it('hoists navigation.icon to the top level for a .navigation.yml directory config', () => {
    const { fireFileParsed } = setupPlugin()
    const ctx = { file: file('4.api/3.utils/.navigation', { 'title': 'Utils', 'navigation.icon': 'i-lucide-square-function' }, '.yml') }

    fireFileParsed(ctx)

    expect(ctx.file.data).toEqual({ title: 'Utils', icon: 'i-lucide-square-function' })
  })

  it('ignores a null file (a rejected parse)', () => {
    const { fireFileParsed } = setupPlugin()
    expect(() => fireFileParsed({ file: null })).not.toThrow()
  })

  it('ignores frontmatter that parsed to a string or array, not an object', () => {
    const { fireFileParsed } = setupPlugin()
    const stringData = file('readme', 'hello' as unknown as Record<string, unknown>)
    const arrayData = file('list', ['a', 'b'] as unknown as Record<string, unknown>)

    fireFileParsed({ file: stringData })
    fireFileParsed({ file: arrayData })

    expect(stringData.data).toBe('hello')
    expect(arrayData.data).toEqual(['a', 'b'])
  })
})

describe('generateNavigation() with expanded dotted keys', () => {
  const navFile = (path: string, stem: string, data: Record<string, unknown>, extension = '.md') =>
    ({ path, data, meta: { stem, extension, key: stem, source: 'docs', kind: 'document' as const, type: '', partial: false }, nodes: [] })

  it('surfaces the icon expanded from a page-level navigation.icon', async () => {
    const nav = await generateNavigation([
      navFile('/docs/4.x/api/nuxt-config', '4.api/6.nuxt-config', { title: 'Nuxt Config', navigation: { icon: 'i-lucide-cog' } })
    ])

    const page = nav[0]?.children?.[0]?.children?.[0]?.children?.[0]
    expect(page?.icon).toBe('i-lucide-cog')
  })

  it('drops the icon if left nested under a .navigation.yml (the case the hoist fixes)', async () => {
    // `generatePath()` slugifies `.navigation` to a trailing `navigation` path segment — the config's
    // own key (`path` minus its last segment) is what resolves it to the directory it configures.
    const nav = await generateNavigation([
      navFile('/docs/4.x/api/utils/index', '4.api/3.utils/index', { title: 'Utils index' }),
      navFile('/docs/4.x/api/utils/navigation', '4.api/3.utils/.navigation', { title: 'Utils', navigation: { icon: 'i-lucide-square-function' } }, '.yml')
    ])

    const utils = nav[0]?.children?.[0]?.children?.[0]?.children?.[0]
    expect(utils?.icon).toBeUndefined()
  })

  it('surfaces the icon once hoisted for a .navigation.yml', async () => {
    const nav = await generateNavigation([
      navFile('/docs/4.x/api/utils/index', '4.api/3.utils/index', { title: 'Utils index' }),
      navFile('/docs/4.x/api/utils/navigation', '4.api/3.utils/.navigation', { title: 'Utils', icon: 'i-lucide-square-function' }, '.yml')
    ])

    const utils = nav[0]?.children?.[0]?.children?.[0]?.children?.[0]
    expect(utils?.icon).toBe('i-lucide-square-function')
  })
})
