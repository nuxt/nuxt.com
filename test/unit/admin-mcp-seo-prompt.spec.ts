import { afterAll, describe, expect, it, vi } from 'vitest'
import type { ZodType } from 'zod'

vi.stubGlobal('defineMcpPrompt', <T>(definition: T) => definition)
const prompt = (await import('../../server/mcp/prompts/admin/seo-opportunities')).default as unknown as {
  inputSchema: Record<string, ZodType>
  handler: (input: { days: number, top: number, host?: string, pathContains?: string }) => string
}
afterAll(() => vi.unstubAllGlobals())

describe('SEO prompt host scope', () => {
  it('defaults to the whole domain and validates requested hosts within the Nuxt domain', () => {
    expect(prompt.inputSchema.host!.parse(undefined)).toBe('*.nuxt.com')
    expect(prompt.inputSchema.host!.parse(' UI.NUXT.COM ')).toBe('ui.nuxt.com')
    for (const host of ['https://ui.nuxt.com', 'ui.nuxt.com.evil.com', 'other.com', 'ui.nuxt.com|.*', '*.example.com', '*.ui.nuxt.com']) {
      expect(prompt.inputSchema.host!.safeParse(host).success).toBe(false)
    }
  })

  it('includes the apex and nested subdomains by default without matching lookalike domains', () => {
    const text = prompt.handler({ days: 28, top: 5 })
    const filters = JSON.parse(text.match(/`filters=([^`]+)`/)![1]!) as Array<{ expression: string }>
    const scope = new RegExp(filters[0]!.expression)
    for (const url of ['https://nuxt.com/', 'http://nuxt.com/', 'https://ui.nuxt.com/docs', 'https://test.docs.nuxt.com/']) {
      expect(scope.test(url), url).toBe(true)
    }
    for (const url of ['https://notnuxt.com/', 'https://nuxt.com.evil.com/', 'https://ui.nuxtXcom/', 'ftp://ui.nuxt.com/']) {
      expect(scope.test(url), url).toBe(false)
    }
  })

  it('can still narrow the report to only the apex', () => {
    const text = prompt.handler({ days: 28, top: 5, host: 'nuxt.com' })
    const filters = JSON.parse(text.match(/`filters=([^`]+)`/)![1]!) as Array<{ expression: string }>
    const scope = new RegExp(filters[0]!.expression)
    expect(scope.test('https://nuxt.com/')).toBe(true)
    expect(scope.test('https://ui.nuxt.com/')).toBe(false)
  })

  it('replaces the default host filter when a Nuxt subdomain is explicitly requested', () => {
    const text = prompt.handler({ days: 28, top: 5, host: 'ui.nuxt.com', pathContains: '/docs' })
    const filters = JSON.parse(text.match(/`filters=([^`]+)`/)![1]!) as Array<{ operator: string, expression: string }>
    const matches = (url: string) => filters.every(filter => filter.operator === 'includingRegex'
      ? new RegExp(filter.expression).test(url)
      : url.includes(filter.expression))

    expect(matches('https://ui.nuxt.com/docs/getting-started')).toBe(true)
    expect(matches('https://nuxt.com/docs/getting-started')).toBe(false)
    expect(matches('https://uiXnuxt.com/docs/getting-started')).toBe(false)
    expect(matches('https://ui.nuxt.com.evil.com/docs/getting-started')).toBe(false)
  })
})
