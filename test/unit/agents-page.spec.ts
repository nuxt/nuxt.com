import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listMcpTools } from '../../modules/mcp-tools/list'

const root = fileURLToPath(new URL('../..', import.meta.url))
const page = readFileSync(`${root}/content/agents.md`, 'utf8')

describe('/agents', () => {
  const { tools, dirs } = listMcpTools(`${root}/server`)

  it('lists the public MCP tools, without the admin ones', () => {
    expect(tools).toContain('search-documentation')
    expect(dirs.tools).not.toContain('admin')
    expect(dirs.prompts).not.toContain('admin')
  })

  // The copy keeps the count as text so `/raw/agents.md` reads well: update it when a tool is added or removed.
  it('states the number of tools the MCP server has', () => {
    const counts = [...page.matchAll(/\b(\d+) tools\b/g)].map(match => Number(match[1]))
    expect(counts.length).toBeGreaterThan(0)
    expect(new Set(counts)).toEqual(new Set([tools.length]))
  })
})
