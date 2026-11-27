import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MCP_OAUTH_SCOPE_TOOLS } from '../../shared/utils/mcp-admin'

const TOOLS_DIR = join(import.meta.dirname, '../../server/mcp-admin/tools')

describe('admin MCP consent page', () => {
  it('lists every tool under the scope it requires', () => {
    const required: Record<string, string[]> = {}
    for (const file of readdirSync(TOOLS_DIR)) {
      const scopes = readFileSync(join(TOOLS_DIR, file), 'utf8').match(/scopes: \[([^\]]*)\]/)?.[1]
      for (const scope of scopes?.match(/'[^']+'/g)?.map(s => s.slice(1, -1)) ?? ['(none)']) {
        (required[scope] ??= []).push(basename(file, '.ts'))
      }
    }
    const listed = Object.fromEntries(Object.entries(MCP_OAUTH_SCOPE_TOOLS).map(([scope, tools]) => [scope, [...tools].sort()]))
    expect(listed).toEqual(Object.fromEntries(Object.entries(required).map(([scope, tools]) => [scope, tools.sort()])))
  })
})
