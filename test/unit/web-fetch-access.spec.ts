import { describe, expect, it } from 'vitest'
import { isAllowedWebFetchUrl } from '../../layers/nuxi/agent/lib/web-fetch-access'

describe('isAllowedWebFetchUrl', () => {
  it('allows nuxt.com and its subdomains over https', () => {
    for (const url of [
      'https://nuxt.com',
      'https://nuxt.com/docs/4.x/getting-started/introduction',
      'https://ui.nuxt.com/components/button',
      'https://hub.nuxt.com/docs'
    ]) {
      expect(isAllowedWebFetchUrl(url), url).toBe(true)
    }
  })

  it('refuses look-alike hosts that a suffix match would let through', () => {
    for (const url of [
      'https://evilnuxt.com/x',
      'https://nuxt.com.evil.com/x',
      'https://notnuxt.com/x'
    ]) {
      expect(isAllowedWebFetchUrl(url), url).toBe(false)
    }
  })

  it('refuses anything that is not https, including link-local and file URLs', () => {
    for (const url of [
      'http://nuxt.com/docs',
      'http://169.254.169.254/latest/meta-data/',
      'file:///etc/passwd',
      'ftp://nuxt.com/x'
    ]) {
      expect(isAllowedWebFetchUrl(url), url).toBe(false)
    }
  })

  it('refuses a foreign host that only mentions nuxt.com elsewhere in the URL', () => {
    for (const url of [
      'https://evil.com/?target=https://nuxt.com',
      'https://user:pw@evil.com/nuxt.com',
      'https://evil.com#nuxt.com'
    ]) {
      expect(isAllowedWebFetchUrl(url), url).toBe(false)
    }
  })

  it('refuses input that is not a URL at all', () => {
    for (const url of ['', 'not a url', 'nuxt.com/docs', '//nuxt.com/docs']) {
      expect(isAllowedWebFetchUrl(url), url).toBe(false)
    }
  })
})
