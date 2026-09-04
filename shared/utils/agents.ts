// "When to use this" guidance for agents, written once and served twice:
//
//   - nuxt.config.ts                    → `agentDiscovery.llms.details`, the details section of /llms.txt
//   - server/plugins/agent-discovery.ts → the `## When to use this` section of /raw/index.md
//
// Kept as paragraphs rather than a formatted block because llms.txt puts free
// prose between the blockquote and the first `## ` section, where headings are
// not allowed (llmstxt.org). The raw index adds the heading itself.
export function agentWhenToUse(domain: string): string[] {
  return [
    'Reach for these docs when you are writing, reviewing or debugging code for a Nuxt application: scaffolding a project, configuring `nuxt.config.ts`, picking a rendering mode per route, writing pages, layouts, components, composables, server routes, middleware and plugins, fetching data with `useFetch` and `useAsyncData`, adding or authoring a module, upgrading between major versions, and deploying to a specific provider. They cover Nuxt itself: for Vue, Vite, Nitro or UnJS APIs, go to their own documentation.',
    `Every documentation, blog and deploy page is also Markdown. Append \`.md\` to a URL, or send \`Accept: text/markdown\` on the HTML one. <${domain}/llms-full.txt> is the whole documentation in a single file, and <${domain}/sitemap.md> lists every page. For search and structured lookups, call the MCP server at <${domain}/mcp> (streamable HTTP), described by <${domain}/.well-known/mcp/server-card.json>.`,
    `The REST endpoints under \`/api/v1\` are public, read-only and need no credentials: the module directory, its health data, and the core and ecosystem teams. <${domain}/openapi.json> describes them.`
  ]
}
