import { describe, expect, it } from 'vitest'
import { lookupTool } from '../../layers/nuxi/agent/instrumentation/lookups'

describe('lookupTool', () => {
  it('keeps public nuxt.com tools, without the connection prefix', () => {
    expect(lookupTool('nuxt-mcp__get-documentation-page')).toBe('get-documentation-page')
    expect(lookupTool('show_module')).toBe('show_module')
  })

  it('skips tools whose arguments come from the user message', () => {
    expect(lookupTool('search_github_issues')).toBeUndefined()
    expect(lookupTool('web_search')).toBeUndefined()
    expect(lookupTool('show_prompt')).toBeUndefined()
  })

  it('skips other connections', () => {
    expect(lookupTool('admin-mcp__get-module')).toBeUndefined()
  })
})
