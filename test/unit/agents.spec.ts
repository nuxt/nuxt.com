import { describe, expect, it } from 'vitest'
import { agentWhenToUse } from '../../shared/utils/agents'

const paragraphs = agentWhenToUse('https://nuxt.com')

describe('shared/utils/agents', () => {
  it('should stay heading-free, so it fits the llms.txt details slot', () => {
    // llmstxt.org: what sits between the blockquote and the first `## ` section
    // may be any markdown except headings, and one would open a section and
    // pull every link list under it. The module warns at build; fail earlier.
    for (const paragraph of paragraphs) {
      expect(paragraph, paragraph.slice(0, 40)).not.toMatch(/^#{1,6}\s/m)
    }
  })

  it('should name the jobs the docs are the right source for', () => {
    const text = paragraphs.join('\n').toLowerCase()
    for (const job of ['nuxt.config.ts', 'rendering mode', 'server routes', 'useasyncdata', 'module', 'upgrading', 'deploying']) {
      expect(text, job).toContain(job)
    }
  })

  it('should say what Nuxt docs are not the source for', () => {
    expect(paragraphs.join('\n')).toMatch(/Vue, Vite, Nitro or UnJS/)
  })

  it('should tell an agent how to call the site', () => {
    const text = paragraphs.join('\n')
    expect(text).toContain('Accept: text/markdown')
    expect(text).toContain('https://nuxt.com/llms-full.txt')
    expect(text).toContain('https://nuxt.com/sitemap.md')
    expect(text).toContain('https://nuxt.com/mcp')
    expect(text).toContain('https://nuxt.com/openapi.json')
  })

  it('should build every absolute link from the domain it is given', () => {
    // `/llms.txt` is generated against the canonical origin and `/raw/index.md`
    // against the live host, so the same paragraphs are rendered for both.
    const preview = agentWhenToUse('https://preview.nuxt.dev').join('\n')
    expect(preview).not.toContain('https://nuxt.com')
    expect(preview).toContain('https://preview.nuxt.dev/mcp')
  })

  it('should read as guidance rather than a marketing blurb', () => {
    expect(paragraphs.length).toBeGreaterThanOrEqual(3)
    expect(paragraphs.join(' ')).not.toMatch(/\b(powerful|amazing|blazing|revolutionary)\b/i)
  })
})
