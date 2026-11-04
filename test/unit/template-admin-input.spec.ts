import { afterEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineMcpTool', (tool: unknown) => tool)
const { default: tool } = await import('../../server/mcp/tools/admin/start-template-checks')
afterEach(() => vi.unstubAllGlobals())

describe('template check selection', () => {
  it('rejects an empty selection instead of checking every template', () => {
    expect(tool.inputSchema.slugs.safeParse([]).success).toBe(false)
  })

  it('accepts a selected template or an omitted selection', () => {
    expect(tool.inputSchema.slugs.safeParse(['docus']).success).toBe(true)
    expect(tool.inputSchema.slugs.safeParse(undefined).success).toBe(true)
  })
})
