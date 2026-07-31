import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import { describe, expect, it } from 'vitest'
import {
  getModuleCards,
  getToolText,
  isConnectionSearchTool,
  isModuleListTool,
  normalizeToolName,
  type ToolPart
} from '../../layers/nuxi/app/composables/useChatTools'

/** Connection tools reach the UI as dynamic parts, qualified `<connection>__<tool>`. */
function dynamicTool(toolName: string, output?: unknown): ToolPart {
  return {
    type: 'dynamic-tool',
    toolName,
    toolCallId: 'call_1',
    state: 'output-available',
    input: {},
    output
  } as DynamicToolUIPart
}

/** Tools declared in `agent/tools/` keep their name in the part type. */
function staticTool(toolName: string): ToolPart {
  return {
    type: `tool-${toolName}`,
    toolCallId: 'call_1',
    state: 'output-available',
    input: {},
    output: {}
  } as ToolUIPart
}

/** What an MCP tool returns before eve decodes it. */
function mcpTextOutput(payload: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] }
}

describe('normalizeToolName', () => {
  it('strips the connection prefix eve qualifies tools with', () => {
    expect(normalizeToolName('nuxt-mcp__get-module')).toBe('get-module')
    expect(normalizeToolName('nuxt-mcp__list-modules')).toBe('list-modules')
    expect(normalizeToolName('admin-mcp__list-feedback')).toBe('list-feedback')
  })

  it('hyphenates connection tools that use underscores', () => {
    expect(normalizeToolName('vercel-mcp__list_deployments')).toBe('list-deployments')
  })

  it('leaves the discovery tool untouched', () => {
    expect(normalizeToolName('connection_search')).toBe('connection_search')
  })

  it('leaves local tools untouched, including those whose own name contains __', () => {
    expect(normalizeToolName('show_module')).toBe('show_module')
    expect(normalizeToolName('web_search')).toBe('web_search')
    expect(normalizeToolName('ai_gateway__report')).toBe('ai_gateway__report')
  })
})

describe('isConnectionSearchTool', () => {
  it('matches the discovery tool', () => {
    expect(isConnectionSearchTool(dynamicTool('connection_search'))).toBe(true)
  })

  it('does not match a connection tool', () => {
    expect(isConnectionSearchTool(dynamicTool('nuxt-mcp__get-module'))).toBe(false)
  })
})

describe('getToolText', () => {
  it('derives a verb from the tool segment, not the connection name', () => {
    expect(getToolText(dynamicTool('nuxt-mcp__get-documentation-page'))).toBe('Read documentation page')
    expect(getToolText(dynamicTool('nuxt-mcp__list-modules'))).toBe('Searched modules')
  })

  it('keeps working for local tools', () => {
    expect(getToolText(staticTool('show_module'))).toBe('Found module')
  })
})

describe('getModuleCards', () => {
  it('reads a card from a qualified get-module call', () => {
    const part = dynamicTool('nuxt-mcp__get-module', mcpTextOutput({
      name: '@nuxt/ui',
      npm: '@nuxt/ui',
      description: 'UI library',
      stats: { downloads: 12, stars: 34 }
    }))

    expect(getModuleCards(part)).toEqual([{
      name: '@nuxt/ui',
      npm: '@nuxt/ui',
      description: 'UI library',
      icon: undefined,
      category: undefined,
      repo: undefined,
      website: undefined,
      downloads: 12,
      stars: 34
    }])
    expect(isModuleListTool(part)).toBe(true)
  })

  it('reads cards from a qualified list-modules call, decoded or not', () => {
    const modules = [{ name: 'auth-utils', downloads: 5, stars: 6 }]

    for (const output of [mcpTextOutput({ modules }), { modules }]) {
      const part = dynamicTool('nuxt-mcp__list-modules', output)
      expect(getModuleCards(part)).toHaveLength(1)
      expect(getModuleCards(part)[0]).toMatchObject({ name: 'auth-utils', downloads: 5, stars: 6 })
      expect(isModuleListTool(part)).toBe(true)
    }
  })

  it('ignores tools that carry no module payload', () => {
    expect(isModuleListTool(dynamicTool('nuxt-mcp__get-documentation-page', { title: 'Routing' }))).toBe(false)
    expect(getModuleCards(dynamicTool('nuxt-mcp__get-module', mcpTextOutput({ error: 'not found' })))).toEqual([])
  })
})
