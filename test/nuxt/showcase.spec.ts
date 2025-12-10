import { describe, expect, it } from 'vitest'
import { getWebsiteScreenShotUrl } from '../../app/utils/showcase'

describe('utils/showcase', () => {
  describe('getWebsiteScreenShotUrl', () => {
    it('should generate screenshot URL from website name', () => {
      const website = { name: 'My Website' }
      expect(getWebsiteScreenShotUrl(website)).toBe('/assets/websites/my-website.png')
    })

    it('should handle names with special characters', () => {
      const website = { name: 'Test & Demo' }
      expect(getWebsiteScreenShotUrl(website)).toBe('/assets/websites/test-demo.png')
    })

    it('should convert to kebab case', () => {
      const website = { name: 'CamelCaseWebsite' }
      expect(getWebsiteScreenShotUrl(website)).toBe('/assets/websites/camel-case-website.png')
    })

    it('should handle multiple consecutive spaces', () => {
      const website = { name: 'Multiple   Spaces' }
      expect(getWebsiteScreenShotUrl(website)).toBe('/assets/websites/multiple-spaces.png')
    })

    it('should handle empty name', () => {
      const website = { name: '' }
      expect(getWebsiteScreenShotUrl(website)).toBe('/assets/websites/.png')
    })

    it('should handle missing name', () => {
      const website = {}
      expect(getWebsiteScreenShotUrl(website)).toBe('/assets/websites/.png')
    })
  })
})
