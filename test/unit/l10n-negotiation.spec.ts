import { describe, expect, it } from 'vitest'
import { localeNegotiationRoutes } from '../../modules/l10n-negotiation'

const VARY = 'Accept, User-Agent'
const acceptMarkdown = { type: 'header', key: 'accept', value: '(.*,)?\\s*text/markdown\\s*([;,].*)?' }
const refusesMarkdown = { type: 'header', key: 'accept', value: '.*text/markdown\\s*;\\s*[qQ]=0(\\.0+)?(\\s*[;,].*)?' }
const agentUserAgent = { type: 'header', key: 'user-agent', value: '.*([cC]laude).*' }

/** The shape of the routes `nuxt-agent-discovery` emits for a cached `/docs/**`. */
const AGENT_ROUTES = [
  { src: '^(?!.*\\.[^/]*$)(?!/raw/)(?:/docs/(.*))$', headers: { Vary: VARY }, methods: ['GET', 'HEAD'], continue: true },
  { src: '^(?!/raw/)/docs/(.*)\\.md$', dest: '/raw/docs/$1.md', methods: ['GET', 'HEAD'] },
  { src: '^(?!.*\\.[^/]*$)(?!/raw/)/docs/(.*)$', status: 307, headers: { Location: '/raw/docs/$1.md', Vary: VARY }, has: [acceptMarkdown], missing: [refusesMarkdown], methods: ['GET', 'HEAD'] },
  { src: '^(?!.*\\.[^/]*$)(?!/raw/)/docs/(.*)$', status: 307, headers: { Location: '/raw/docs/$1.md', Vary: VARY }, has: [agentUserAgent], methods: ['GET', 'HEAD'] },
  { src: '^(?!.*\\.[^/]*$)(?!/raw/)/blog/(.*)$', status: 307, headers: { Location: '/raw/blog/$1.md', Vary: VARY }, has: [acceptMarkdown], missing: [refusesMarkdown], methods: ['GET', 'HEAD'] },
  { src: '^/$', headers: { Link: '</llms.txt>' }, continue: true }
]

describe('localeNegotiationRoutes', () => {
  const routes = localeNegotiationRoutes(AGENT_ROUTES, ['fr'])
  const redirects = routes.filter(route => route.status === 307)

  it('should send agents on a localised page to its English twin, under the conditions agent discovery uses', () => {
    expect(redirects).toEqual([
      { src: '^/fr(/docs/(?!.*\\.[^/]*$).*)$', status: 307, headers: { Location: '$1', Vary: VARY }, has: [acceptMarkdown], missing: [refusesMarkdown], methods: ['GET', 'HEAD'] },
      { src: '^/fr(/docs/(?!.*\\.[^/]*$).*)$', status: 307, headers: { Location: '$1', Vary: VARY }, has: [agentUserAgent], methods: ['GET', 'HEAD'] }
    ])
  })

  it('should vary localised pages on the same headers', () => {
    expect(routes[0]).toEqual({ src: '^/fr(/docs/(?!.*\\.[^/]*$).*)$', headers: { Vary: VARY }, methods: ['GET', 'HEAD'], continue: true })
  })

  it('should match localised pages only', () => {
    const pattern = new RegExp(redirects[0]!.src)
    expect('/fr/docs/4.x/getting-started/introduction'.replace(pattern, '$1')).toBe('/docs/4.x/getting-started/introduction')
    expect(pattern.test('/fr/docs/4.x/getting-started/introduction.md')).toBe(false)
    expect(pattern.test('/docs/4.x/getting-started/introduction')).toBe(false)
    expect(pattern.test('/fr/modules')).toBe(false)
  })

  it('should emit nothing when agent discovery negotiates no cached route', () => {
    expect(localeNegotiationRoutes(AGENT_ROUTES.filter(route => route.status !== 307), ['fr'])).toEqual([])
  })
})
