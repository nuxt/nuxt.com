import { eventHandler, setHeader } from 'h3'

export default eventHandler((event) => {
  const DOMAIN = getSiteConfig(event).url
  const title = 'Nuxt'
  const description = 'The Intuitive Vue Framework. Build performant and production-grade full-stack web apps and websites with confidence.'

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `canonical_url: ${JSON.stringify(DOMAIN)}`,
    `last_updated: ${JSON.stringify(new Date().toISOString().split('T')[0])}`,
    '---',
    ''
  ].join('\n')

  const body = `# ${title}

> ${description}

## About

Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.

- File-based routing, layouts, middleware and auto-imports
- Server engine powered by Nitro (universal deployment, edge-ready)
- Hybrid rendering: SSR, SSG, ISR, SPA on a per-route basis
- 200+ official and community modules
- TypeScript-first with full IDE support
- Built on top of Vue 3 and Vite

## Getting started

\`\`\`bash
npx nuxi@latest init <project-name>
cd <project-name>
npm install
npm run dev
\`\`\`

- Introduction: <${DOMAIN}/docs/getting-started/introduction>
- Installation: <${DOMAIN}/docs/getting-started/installation>
- Configuration: <${DOMAIN}/docs/getting-started/configuration>

## Explore

- Documentation: <${DOMAIN}/docs>
- Modules: <${DOMAIN}/modules>
- Templates: <${DOMAIN}/templates>
- Showcase: <${DOMAIN}/showcase>
- Deploy: <${DOMAIN}/deploy>
- Blog: <${DOMAIN}/blog>
- Team: <${DOMAIN}/team>
- Sitemap (XML): <${DOMAIN}/sitemap.xml>
- Sitemap (Markdown): <${DOMAIN}/sitemap.md>
- LLMs index: <${DOMAIN}/llms.txt>
- Full LLMs documentation: <${DOMAIN}/llms-full.txt>

## Resources for Agents

- MCP Server Card: <${DOMAIN}/.well-known/mcp/server-card.json>
- MCP endpoint: <${DOMAIN}/mcp>
- API Catalog: <${DOMAIN}/.well-known/api-catalog>

## Community

- GitHub: <https://github.com/nuxt/nuxt>
- Discord: <https://chat.nuxt.dev>
- X (Twitter): <https://x.com/nuxt_js>
- Bluesky: <https://bsky.app/profile/nuxt.com>
`

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Link', `<${DOMAIN}>; rel="canonical"`)
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return frontmatter + body
})
