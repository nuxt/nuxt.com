import { queryCollection } from '@nuxt/content/server'
import { CURRENT_DOCS_VERSION } from '#shared/utils/docs'

export default defineCachedEventHandler(async (event) => {
  const domain = getSiteUrl(event)
  const index = await queryCollection(event, 'index').first()

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
    '\n'
  ].join('\n')

  const body = `# ${title}

${description}

## Features

${featureBullets}

## Getting started

\`\`\`bash
npx nuxi@latest init <project-name>
cd <project-name>
npm install
npm run dev
\`\`\`

- Introduction: <${domain}/raw/docs/${CURRENT_DOCS_VERSION}/getting-started/introduction.md>
- Installation: <${domain}/raw/docs/${CURRENT_DOCS_VERSION}/getting-started/installation.md>
- Configuration: <${domain}/raw/docs/${CURRENT_DOCS_VERSION}/getting-started/configuration.md>

## Explore

- Documentation: <${domain}/docs>
- Modules: <${domain}/raw/modules.md>
- Templates: <${domain}/templates>
- Showcase: <${domain}/showcase>
- Deploy: <${domain}/deploy>
- Blog: <${domain}/blog/rss.xml>
- Changelog: <${domain}/changelog/rss.xml>
- Team: <${domain}/team>
- Design system: <${domain}/design.md>
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
