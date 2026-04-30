import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'

type queryCollectionWithEvent = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

export default defineCachedEventHandler(async (event) => {
  const domain = getSiteUrl(event)
  const index = await (queryCollection as queryCollectionWithEvent)(event, 'index').first()

  const title = index?.hero?.title?.replace(/\s+/g, ' ').trim() || 'Nuxt'
  const description = index?.hero?.description?.replace(/\s+/g, ' ').trim()
    || 'The Intuitive Vue Framework. Build performant and production-grade full-stack web apps and websites with confidence.'

  const featureBullets = (index?.features?.features ?? [])
    .map(feature => `- **${feature.title}**: ${feature.description}`)
    .join('\n')

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `canonical_url: ${JSON.stringify(domain)}`,
    `last_updated: ${JSON.stringify(new Date().toISOString().split('T')[0])}`,
    '---',
    ''
  ].join('\n')

  const body = `# ${title}

> ${description}

## About

Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.

${featureBullets}

## Getting started

\`\`\`bash
npx nuxi@latest init <project-name>
cd <project-name>
npm install
npm run dev
\`\`\`

- Introduction: <${domain}/docs/getting-started/introduction>
- Installation: <${domain}/docs/getting-started/installation>
- Configuration: <${domain}/docs/getting-started/configuration>

## Explore

- Documentation: <${domain}/docs>
- Modules: <${domain}/modules>
- Templates: <${domain}/templates>
- Showcase: <${domain}/showcase>
- Deploy: <${domain}/deploy>
- Blog: <${domain}/blog>
- Team: <${domain}/team>
- Sitemap (XML): <${domain}/sitemap.xml>
- Sitemap (Markdown): <${domain}/sitemap.md>
- LLMs index: <${domain}/llms.txt>
- Full LLMs documentation: <${domain}/llms-full.txt>

## Resources for Agents

- MCP Server Card: <${domain}/.well-known/mcp/server-card.json>
- MCP endpoint: <${domain}/mcp>
- API Catalog: <${domain}/.well-known/api-catalog>

## Community

- GitHub: <https://github.com/nuxt/nuxt>
- Discord: <https://chat.nuxt.dev>
- X (Twitter): <https://x.com/nuxt_js>
- Bluesky: <https://bsky.app/profile/nuxt.com>
`

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Link', [
    `<${domain}>; rel="canonical"`,
    `<${domain}>; rel="alternate"; type="text/html"`
  ].join(', '))
  return frontmatter + body
}, {
  name: 'raw-index-md',
  swr: true,
  maxAge: 60 * 60
})
