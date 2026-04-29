import { eventHandler, setResponseHeader } from 'h3'

export default eventHandler((event) => {
  const DOMAIN = getSiteConfig(event).url
  const linkset = {
    linkset: [
      {
        'anchor': `${DOMAIN}/mcp`,
        'service-desc': [
          {
            href: `${DOMAIN}/.well-known/mcp/server-card.json`,
            type: 'application/json'
          }
        ],
        'service-doc': [
          {
            href: `${DOMAIN}/docs/4.x/guide/ai/mcp`,
            type: 'text/html'
          }
        ]
      },
      {
        'anchor': `${DOMAIN}/docs`,
        'service-desc': [
          {
            href: `${DOMAIN}/llms.txt`,
            type: 'text/plain'
          },
          {
            href: `${DOMAIN}/llms-full.txt`,
            type: 'text/plain'
          }
        ],
        'service-doc': [
          {
            href: `${DOMAIN}/docs`,
            type: 'text/html'
          }
        ]
      },
      {
        'anchor': `${DOMAIN}/api/v1`,
        'service-doc': [
          {
            href: `${DOMAIN}/api/v1`,
            type: 'text/html'
          }
        ]
      }
    ]
  }

  setResponseHeader(event, 'Content-Type', 'application/linkset+json; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return JSON.stringify(linkset, null, 2)
})
