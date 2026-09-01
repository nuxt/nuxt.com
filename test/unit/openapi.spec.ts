import { describe, expect, it } from 'vitest'
import { apiPaths, createOpenApiDocument } from '../../server/utils/openapi'

const discovery = {
  tags: [{ name: 'Pages', description: 'Negotiated pages.' }],
  paths: {
    '/docs/{path}': { get: { operationId: 'getDocsPage', tags: ['Pages'], responses: { 200: { description: 'ok' } } } },
    // A discovery path colliding with a site path: the site's description wins.
    '/api/v1/teams': { get: { operationId: 'getTeamsGenerated', responses: { 200: { description: 'generated' } } } }
  },
  components: {
    schemas: {
      Discovery: { type: 'object' }
    }
  }
}

describe('openapi.json document', () => {
  const document = createOpenApiDocument({ url: 'https://nuxt.com', discovery })

  it('is an OpenAPI 3.1 document served for the configured origin', () => {
    expect(document.openapi).toBe('3.1.0')
    expect(document.servers).toEqual([{ url: 'https://nuxt.com', description: 'Production' }])
    expect(document.security).toEqual([])
    expect(JSON.parse(JSON.stringify(document))).toEqual(document)
  })

  it('keeps the discovery fragments and lets site paths win collisions', () => {
    expect(document.paths['/docs/{path}']).toBeDefined()
    expect(document.components.schemas.Discovery).toBeDefined()
    expect(document.tags.map(tag => (tag as { name: string }).name)).toContain('Pages')
    const teams = document.paths['/api/v1/teams'] as { get: { operationId: string } }
    expect(teams.get.operationId).toBe('getTeams')
  })

  it('describes every stable /api/v1 endpoint with a unique operationId', () => {
    for (const path of ['/api/v1/modules', '/api/v1/modules/health', '/api/v1/modules/{name}', '/api/v1/teams', '/api/v1/teams/{slug}']) {
      expect(document.paths[path], path).toBeDefined()
    }
    const ids = Object.values(apiPaths)
      .flatMap(path => Object.values(path as Record<string, { operationId?: string }>))
      .map(operation => operation.operationId)
    expect(ids).not.toContain(undefined)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('references only schemas the document defines', () => {
    const refs = [...JSON.stringify(document).matchAll(/#\/components\/schemas\/(\w+)/g)].map(match => match[1])
    for (const ref of refs) {
      expect(document.components.schemas[ref as keyof typeof document.components.schemas], ref).toBeDefined()
    }
  })
})
