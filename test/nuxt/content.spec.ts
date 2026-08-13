import { describe, expect, it } from 'vitest'
import { navPageFromPath, findTitleTemplate } from '../../app/utils/content'
import type { NavNode } from '../../app/utils/content'

describe('utils/content', () => {
  describe('navPageFromPath', () => {
    it('should find page at root level', () => {
      const tree: NavNode[] = [
        { title: 'Blog', path: '/blog', stem: 'blog' },
        { title: 'Team', path: '/team', stem: 'team' }
      ]
      const result = navPageFromPath('/blog', tree)
      expect(result).toEqual({ title: 'Blog', path: '/blog', stem: 'blog' })
    })

    it('should find page in nested children', () => {
      const tree: NavNode[] = [
        {
          title: 'Docs',
          path: '/docs/4.x',
          stem: 'docs/4.x',
          children: [
            { title: 'Introduction', path: '/docs/4.x/getting-started/introduction', stem: 'docs/4.x/1.getting-started/01.introduction' }
          ]
        }
      ]
      const result = navPageFromPath('/docs/4.x/getting-started/introduction', tree)
      expect(result).toEqual({ title: 'Introduction', path: '/docs/4.x/getting-started/introduction', stem: 'docs/4.x/1.getting-started/01.introduction' })
    })

    it('should find page in deeply nested structure', () => {
      const tree: NavNode[] = [
        {
          title: 'Docs',
          path: '/docs/4.x',
          stem: 'docs/4.x',
          children: [
            {
              title: 'API',
              path: '/docs/4.x/api',
              stem: 'docs/4.x/4.api',
              children: [
                {
                  title: 'Composables',
                  path: '/docs/4.x/api/composables',
                  stem: 'docs/4.x/4.api/2.composables',
                  children: [
                    { title: 'useFetch', path: '/docs/4.x/api/composables/use-fetch', stem: 'docs/4.x/4.api/2.composables/use-fetch' }
                  ]
                }
              ]
            }
          ]
        }
      ]
      const result = navPageFromPath('/docs/4.x/api/composables/use-fetch', tree)
      expect(result).toEqual({ title: 'useFetch', path: '/docs/4.x/api/composables/use-fetch', stem: 'docs/4.x/4.api/2.composables/use-fetch' })
    })

    it('should return undefined for non-existent path', () => {
      const tree: NavNode[] = [
        { title: 'Blog', path: '/blog', stem: 'blog' }
      ]
      const result = navPageFromPath('/non-existent', tree)
      expect(result).toBeUndefined()
    })

    it('should handle empty tree', () => {
      const result = navPageFromPath('/docs', [])
      expect(result).toBeUndefined()
    })
  })

  describe('findTitleTemplate', () => {
    it('should return default template when page has no path', () => {
      const result = findTitleTemplate(undefined, undefined, [], '/docs/4.x')
      expect(result).toBe('%s · Nuxt')
    })

    it('should use page titleTemplate if available', () => {
      const result = findTitleTemplate('/test', '%s | Custom', [], '/docs/4.x')
      expect(result).toBe('%s | Custom')
    })

    it('should return default template when no matching navigation found', () => {
      const result = findTitleTemplate('/docs/4.x/guide/introduction', undefined, [], '/docs/4.x')
      expect(result).toBe('%s · Nuxt')
    })

    it('should find titleTemplate from parent in navigation tree', () => {
      const navigation: NavNode[] = [
        {
          title: 'Docs',
          path: '/docs/4.x',
          stem: 'docs/4.x',
          titleTemplate: null,
          children: [
            {
              title: 'Get Started',
              titleTemplate: '%s · Get Started with Nuxt',
              path: '/docs/4.x/getting-started',
              stem: 'docs/4.x/1.getting-started',
              children: [
                { title: 'Introduction', path: '/docs/4.x/getting-started/introduction', stem: 'docs/4.x/1.getting-started/01.introduction', titleTemplate: null }
              ]
            }
          ]
        }
      ]
      const result = findTitleTemplate('/docs/4.x/getting-started/introduction', undefined, navigation, '/docs/4.x')
      expect(result).toBe('%s · Get Started with Nuxt')
    })

    it('should handle v4 docs paths with version cleaning', () => {
      const navigation: NavNode[] = [
        {
          title: 'Docs',
          path: '/docs/4.x',
          stem: 'docs/4.x',
          titleTemplate: null,
          children: [
            {
              title: 'API',
              titleTemplate: '%s · Nuxt API',
              path: '/docs/4.x/api',
              stem: 'docs/4.x/4.api',
              children: [
                {
                  title: 'Composables',
                  titleTemplate: '%s · Nuxt Composables',
                  path: '/docs/4.x/api/composables',
                  stem: 'docs/4.x/4.api/2.composables',
                  children: [
                    { title: 'useFetch', path: '/docs/4.x/api/composables/use-fetch', stem: 'docs/4.x/4.api/2.composables/use-fetch', titleTemplate: null }
                  ]
                }
              ]
            }
          ]
        }
      ]
      const result = findTitleTemplate('/docs/4.x/api/composables/use-fetch', undefined, navigation, '/docs/4.x')
      expect(result).toBe('%s · Nuxt Composables')
    })
  })
})
