export default defineCachedEventHandler((event) => {
  const domain = getSiteUrl(event)
  const linkset = {
    linkset: [
      {
        'anchor': `${domain}/mcp`,
        'service-desc': [
          {
            href: `${domain}/.well-known/mcp/server-card.json`,
            type: 'application/json'
          }
        ],
        'service-doc': [
          {
            href: `${domain}/docs/${DOCS_VERSION}/guide/ai/mcp`,
            type: 'text/html'
          }
        ]
      },
      {
        'anchor': `${domain}/docs`,
        'service-desc': [
          {
            href: `${domain}/llms.txt`,
            type: 'text/plain'
          },
          {
            href: `${domain}/llms-full.txt`,
            type: 'text/plain'
          }
        ],
        'service-doc': [
          {
            href: `${domain}/docs`,
            type: 'text/html'
          }
        ]
      },
      {
        'anchor': `${domain}/api/v1`,
        'service-doc': [
          {
            href: `${domain}/api/v1`,
            type: 'text/html'
          }
        ]
      }
    ]
  }

  setResponseHeader(event, 'Content-Type', 'application/linkset+json; charset=utf-8')
  return linkset
}, {
  name: 'well-known-api-catalog',
  swr: true,
  maxAge: 60 * 60
})
