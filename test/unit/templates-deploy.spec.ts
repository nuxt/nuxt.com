import { describe, expect, it } from 'vitest'
import type { Template } from '../../shared/types/templates'
import { buildDeployUrl, deployProviders } from '../../shared/utils/templates'

const base: Template = { name: 'Docs', slug: 'nuxt-ui-docs', description: 'Docs template.', repo: 'nuxt-ui-templates/docs' }

describe('deployProviders', () => {
  it('offers every provider by default', () => {
    expect(deployProviders(base)).toEqual(['vercel', 'netlify'])
  })

  it('limits templates with Vercel stores to Vercel', () => {
    expect(deployProviders({ deploy: { stores: [{ type: 'blob' }] } })).toEqual(['vercel'])
  })

  it('lets a template opt out', () => {
    expect(deployProviders({ deploy: { providers: [] } })).toEqual([])
  })
})

describe('buildDeployUrl', () => {
  it('points Netlify at the repository', () => {
    expect(buildDeployUrl(base, 'netlify')).toBe('https://app.netlify.com/start/deploy?repository=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fdocs')
  })

  it('passes the branch of a starter to Netlify', () => {
    const url = new URL(buildDeployUrl({ ...base, slug: 'content', repo: 'nuxt/starter', branch: 'content', kind: 'starter' }, 'netlify')!)
    expect(url.searchParams.get('repository')).toBe('https://github.com/nuxt/starter')
    expect(url.searchParams.get('branch')).toBe('content')
  })

  it('clones only the subdirectory and asks for env vars on Netlify', () => {
    const url = new URL(buildDeployUrl({
      ...base,
      repo: 'nuxt-modules/shopify',
      deploy: { repositoryUrl: 'https://github.com/nuxt-modules/shopify/tree/main/template', env: ['NUXT_SHOPIFY_NAME', 'NUXT_SHOPIFY_TOKEN'] }
    }, 'netlify')!)
    expect(url.searchParams.get('repository')).toBe('https://github.com/nuxt-modules/shopify')
    expect(url.searchParams.get('branch')).toBe('main')
    expect(url.searchParams.get('create_from_path')).toBe('template')
    expect(url.hash).toBe('#NUXT_SHOPIFY_NAME=&NUXT_SHOPIFY_TOKEN=')
  })

  it('keeps the Vercel clone URL', () => {
    const url = new URL(buildDeployUrl(base, 'vercel')!)
    expect(url.origin + url.pathname).toBe('https://vercel.com/new/clone')
    expect(url.searchParams.get('repository-url')).toBe('https://github.com/nuxt-ui-templates/docs')
  })

  it('skips providers the template does not support', () => {
    expect(buildDeployUrl({ ...base, deploy: { stores: [{ type: 'blob' }] } }, 'netlify')).toBeUndefined()
  })
})
