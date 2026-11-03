import { describe, expect, it } from 'vitest'
import { getVersionByPath } from '../../shared/utils/docs'
import { indexedLocales, isLocalisedPage, l10nHead, localeLinks, localeRedirect, pageIndexable, parseLocalePath } from '../../shared/utils/l10n'

/** A few of the site's redirect rules, keyed by English path. */
const RULES: Record<string, string> = {
  '/docs': '/docs/getting-started/introduction',
  '/docs/3.x': '/docs/3.x/getting-started/introduction',
  '/docs/4.x': '/docs/4.x/getting-started/introduction',
  '/docs/4.x/guide/concepts': '/docs/4.x/guide/concepts/auto-imports',
  '/docs/2.x': '/docs/2.x/getting-started/installation'
}
const redirect = (url: string) => localeRedirect(url, pathname => RULES[pathname])

describe('parseLocalePath', () => {
  it('should split a localised URL into its locale and English page', () => {
    expect(parseLocalePath('/fr/docs/4.x/guide?x=1#y')).toEqual({ locale: 'fr', path: '/docs/4.x/guide?x=1#y' })
    expect(parseLocalePath('/fr')).toEqual({ locale: 'fr', path: '/' })
  })

  it('should resolve the version of a localised page from its English path', () => {
    expect(getVersionByPath(parseLocalePath('/fr/docs/3.x/getting-started/introduction')!.path)).toBe('3.x')
    expect(getVersionByPath(parseLocalePath('/fr/docs/4.x/getting-started/introduction')!.path)).toBe('4.x')
  })

  it('should flag a prefix that is not a served locale', () => {
    expect(parseLocalePath('/de/docs/4.x')?.locale).toBeUndefined()
  })

  it('should leave English URLs alone', () => {
    expect(parseLocalePath('/docs/4.x/guide')).toBeNull()
    expect(parseLocalePath('/e/abc')).toBeNull()
    expect(parseLocalePath('/fresh')).toBeNull()
  })

  it.each(['//evil.com', '/\\evil.com', '///evil.com'])('should never point %s off the site', (rest) => {
    expect(parseLocalePath(`/fr${rest}`)?.path).toBe('/evil.com')
  })
})

describe('isLocalisedPage', () => {
  it('should accept pages of translated docs versions', () => {
    expect(isLocalisedPage('/docs/3.x/getting-started/introduction')).toBe(true)
    expect(isLocalisedPage('/docs/4.x/api/commands/dev')).toBe(true)
    expect(isLocalisedPage('/docs/5.x/guide')).toBe(true)
  })

  it('should reject the examples, archived docs and the rest of the site', () => {
    expect(isLocalisedPage('/docs/examples/hello-world')).toBe(false)
    expect(isLocalisedPage('/docs/2.x/guide')).toBe(false)
    expect(isLocalisedPage('/docs/4.x')).toBe(false)
    expect(isLocalisedPage('/modules/fonts')).toBe(false)
    expect(isLocalisedPage('/raw/docs/4.x/guide.md')).toBe(false)
  })

  it('should reject markdown twins and other files', () => {
    expect(isLocalisedPage('/docs/4.x/getting-started/introduction.md')).toBe(false)
    expect(isLocalisedPage('/docs/4.x/robots.txt')).toBe(false)
    expect(isLocalisedPage('/docs/4.x/api/nuxt-config?v=1.2')).toBe(true)
  })
})

describe('localeRedirect', () => {
  it('should send the locale root and docs root to the current docs index', () => {
    expect(redirect('/fr')).toBe('/fr/docs/4.x/getting-started/introduction')
    expect(redirect('/fr/')).toBe('/fr/docs/4.x/getting-started/introduction')
    expect(redirect('/fr/docs')).toBe('/fr/docs/4.x/getting-started/introduction')
  })

  it('should send a version root to its own index', () => {
    expect(redirect('/fr/docs/3.x')).toBe('/fr/docs/3.x/getting-started/introduction')
    expect(redirect('/fr/docs/4.x/')).toBe('/fr/docs/4.x/getting-started/introduction')
  })

  it('should follow the English redirects and keep the target localised', () => {
    expect(redirect('/fr/docs/4.x/guide/concepts')).toBe('/fr/docs/4.x/guide/concepts/auto-imports')
    expect(redirect('/fr/docs/guide/concepts?x=1')).toBe('/fr/docs/4.x/guide/concepts/auto-imports?x=1')
  })

  it('should version an unversioned docs path', () => {
    expect(redirect('/fr/docs/api/composables/use-fetch')).toBe('/fr/docs/4.x/api/composables/use-fetch')
  })

  it('should send pages without a localised twin to the English URL', () => {
    expect(redirect('/fr/modules')).toBe('/modules')
    expect(redirect('/fr/llms.txt')).toBe('/llms.txt')
    expect(redirect('/fr/raw/docs/4.x/getting-started/introduction.md')).toBe('/raw/docs/4.x/getting-started/introduction.md')
    expect(redirect('/fr/docs/examples/hello-world')).toBe('/docs/examples/hello-world')
    expect(redirect('/fr/docs/2.x')).toBe('/docs/2.x/getting-started/installation')
    expect(redirect('/fr/mcp')).toBe('/mcp')
    expect(redirect('/fr/docs/4.x/getting-started/introduction.md')).toBe('/docs/4.x/getting-started/introduction.md')
  })

  it('should send docs under an unknown locale to English', () => {
    expect(redirect('/de/docs/4.x/guide')).toBe('/docs/4.x/guide')
    expect(redirect('/de/docs')).toBe('/docs')
  })

  it('should send a localised page reached through a non-canonical prefix to its URL', () => {
    expect(redirect('/FR/docs/4.x/getting-started/introduction')).toBe('/fr/docs/4.x/getting-started/introduction')
    expect(redirect('/fr//docs/4.x/getting-started/introduction?x=1')).toBe('/fr/docs/4.x/getting-started/introduction?x=1')
  })

  it('should serve localised pages as they are', () => {
    expect(redirect('/fr/docs/4.x/getting-started/introduction')).toBeUndefined()
    expect(redirect('/fr/docs/3.x/api/composables/use-fetch?x=1')).toBeUndefined()
    expect(redirect('/docs/4.x/getting-started/introduction')).toBeUndefined()
    expect(redirect('/de/modules')).toBeUndefined()
  })
})

describe('localeLinks', () => {
  it('should link an English docs page to its French twin, flagged as machine translated', () => {
    expect(localeLinks('/docs/4.x/getting-started/introduction')).toEqual([
      { locale: 'fr', label: 'Français', description: 'Traduction automatique', to: '/fr/docs/4.x/getting-started/introduction' }
    ])
  })

  it('should offer no translation for pages without a localised twin', () => {
    expect(localeLinks('/blog/v4')).toEqual([])
    expect(localeLinks('/docs/examples/hello-world')).toEqual([])
    expect(localeLinks('/docs/2.x/guide')).toEqual([])
  })
})

describe('indexedLocales', () => {
  it('should only suggest locales with an indexable page', () => {
    expect(indexedLocales({})).toEqual([])
    expect(indexedLocales({ fr: [] })).toEqual([])
    expect(indexedLocales({ fr: ['/docs/4.x/guide'] })).toEqual(['fr'])
  })
})

describe('pageIndexable', () => {
  it('should keep only what one page reads of the indexable pages', () => {
    const indexable = { fr: ['/docs/4.x/guide', '/docs/4.x/api'] }
    expect(pageIndexable(indexable, '/docs/4.x/api')).toEqual({ locales: ['fr'], indexable: { fr: ['/docs/4.x/api'] } })
    expect(pageIndexable(indexable, '/docs/4.x/other')).toEqual({ locales: ['fr'], indexable: {} })
  })
})

describe('l10nHead', () => {
  const siteUrl = 'https://nuxt.com'
  const path = '/docs/4.x/getting-started/introduction'

  it('should point a French page at itself and its English twin', () => {
    const head = l10nHead({ siteUrl, path, locale: 'fr', indexable: {} })
    expect(head.url).toBe('https://nuxt.com/fr/docs/4.x/getting-started/introduction')
    expect(head.alternates).toEqual([
      { hreflang: 'en', href: 'https://nuxt.com/docs/4.x/getting-started/introduction' },
      { hreflang: 'x-default', href: 'https://nuxt.com/docs/4.x/getting-started/introduction' }
    ])
    expect(head.robots).toBe('noindex, follow')
  })

  it('should list no alternates on an English page without an indexable translation', () => {
    expect(l10nHead({ siteUrl, path, indexable: { fr: ['/docs/4.x/guide'] } })).toEqual({
      url: 'https://nuxt.com/docs/4.x/getting-started/introduction',
      alternates: []
    })
  })

  it('should list an indexable translation on both twins', () => {
    const indexable = { fr: [path] }
    const alternates = [
      { hreflang: 'en', href: 'https://nuxt.com/docs/4.x/getting-started/introduction' },
      { hreflang: 'fr', href: 'https://nuxt.com/fr/docs/4.x/getting-started/introduction' },
      { hreflang: 'x-default', href: 'https://nuxt.com/docs/4.x/getting-started/introduction' }
    ]
    expect(l10nHead({ siteUrl, path, indexable })).toEqual({ url: 'https://nuxt.com/docs/4.x/getting-started/introduction', alternates })
    expect(l10nHead({ siteUrl: 'https://nuxt.com/', path, locale: 'fr', indexable })).toEqual({ url: 'https://nuxt.com/fr/docs/4.x/getting-started/introduction', alternates })
  })
})
