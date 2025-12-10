import { describe, expect, it } from 'vitest'

describe('runtime environment', () => {
  it('should work', () => {
    expect(useRuntimeConfig().app).toMatchInlineSnapshot(`
      {
        "baseURL": "/",
        "buildAssetsDir": "/_nuxt/",
        "buildId": "test",
        "cdnURL": "",
      }
    `)
  })
})

describe('utils/index', () => {
  describe('formatNumber', () => {
    it('should format large numbers in compact notation', () => {
      expect(formatNumber(1000)).toBe('1K')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(1000000)).toBe('1M')
      expect(formatNumber(2500000)).toBe('2.5M')
    })

    it('should format small numbers without notation', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('searchTextRegExp', () => {
    it('should create case-insensitive regex from query', () => {
      const regex = searchTextRegExp('test')
      expect(regex.test('TEST')).toBe(true)
      expect(regex.test('Test')).toBe(true)
      expect(regex.test('test')).toBe(true)
      expect(regex.test('other')).toBe(false)
    })

    it('should escape special regex characters', () => {
      const regex = searchTextRegExp('test.com')
      expect(regex.test('test.com')).toBe(true)
      expect(regex.test('testacom')).toBe(false)
    })

    it('should handle empty query', () => {
      const regex = searchTextRegExp('')
      expect(regex.test('anything')).toBe(true)
    })
  })

  describe('formatDateByLocale', () => {
    it('should format date for en-GB locale', () => {
      const result = formatDateByLocale('en-GB', '2024-01-15')
      expect(result).toBe('15 January 2024')
    })

    it('should format date for en-US locale', () => {
      const result = formatDateByLocale('en-US', '2024-01-15')
      expect(result).toBe('January 15, 2024')
    })

    it('should handle timestamp', () => {
      const timestamp = new Date('2024-01-15').getTime()
      const result = formatDateByLocale('en-GB', timestamp)
      expect(result).toBe('15 January 2024')
    })
  })

  describe('toRelativeDate', () => {
    it('should return "just now" for very recent dates', () => {
      const now = new Date()
      expect(toRelativeDate(now)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 120 * 1000) // 2 minutes ago
      expect(toRelativeDate(date)).toBe('2 minutes ago')
    })

    it('should return hours ago', () => {
      const date = new Date(Date.now() - 2 * 3600 * 1000) // 2 hours ago
      expect(toRelativeDate(date)).toBe('2 hours ago')
    })

    it('should return days ago', () => {
      const date = new Date(Date.now() - 3 * 86400 * 1000) // 3 days ago
      expect(toRelativeDate(date)).toBe('3 days ago')
    })

    it('should return weeks ago', () => {
      const date = new Date(Date.now() - 2 * 604800 * 1000) // 2 weeks ago
      expect(toRelativeDate(date)).toBe('2 weeks ago')
    })

    it('should return months ago', () => {
      const date = new Date(Date.now() - 3 * 2592000 * 1000) // ~3 months ago
      expect(toRelativeDate(date)).toBe('3 months ago')
    })

    it('should return years ago', () => {
      const date = new Date(Date.now() - 2 * 31536000 * 1000) // ~2 years ago
      expect(toRelativeDate(date)).toBe('2 years ago')
    })
  })

  describe('slugify', () => {
    it('should convert text to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('multiple   spaces   here')).toBe('multiple-spaces-here')
    })

    it('should remove special characters', () => {
      expect(slugify('Hello@World!')).toBe('hello-world')
    })

    it('should handle mixed case and special chars', () => {
      expect(slugify('My Awesome Blog Post!')).toBe('my-awesome-blog-post')
    })
  })

  describe('random', () => {
    it('should return element from array', () => {
      const arr = ['a', 'b', 'c']
      const result = random(arr)
      expect(arr).toContain(result)
    })

    it('should return single element for single item array', () => {
      const arr = ['only']
      expect(random(arr)).toBe('only')
    })
  })

  describe('createBreadcrumb', () => {
    it('should create breadcrumb from path', () => {
      expect(createBreadcrumb('/getting-started/introduction')).toBe('Getting Started > Introduction')
    })

    it('should handle kebab-case parts', () => {
      expect(createBreadcrumb('/api/composables/use-state')).toBe('API > Composables > Use State')
    })

    it('should replace Api with API', () => {
      expect(createBreadcrumb('/api/utilities')).toBe('API > Utilities')
    })

    it('should handle http URLs as-is', () => {
      expect(createBreadcrumb('https://example.com/path')).toBe('https://example.com/path')
    })

    it('should handle root path', () => {
      expect(createBreadcrumb('/')).toBe('')
    })

    it('should use default message for missing link', () => {
      expect(createBreadcrumb()).toBe('Missing link')
    })
  })
})
