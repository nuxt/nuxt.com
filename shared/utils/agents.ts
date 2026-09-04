// Guidance for agents, written once and served on every surface that carries it.
//
// Split in two because llms.txt has two homes for it: the details section, the
// free prose llmstxt.org reserves between the blockquote and the first `##`,
// takes the orientation; the jobs these docs are the right source for get their
// own `## When to use this` section, so a reader scanning headings finds them.
//
//   - nuxt.config.ts                    → `agentDiscovery.llms.details` and the `llms.sections` entry
//   - server/plugins/agent-discovery.ts → the two sections of /raw/index.md
//
// Neither carries a heading of its own: the details slot forbids one, and both
// callers add the heading that suits them.

/** The jobs these docs answer, and the ones they do not. */
export function agentWhenToUse(): string[] {
  return [
    'Use these docs when you are writing, reviewing or debugging code for a Nuxt application: scaffolding a project, configuring `nuxt.config.ts`, picking a rendering mode per route, writing pages, layouts, components, composables, server routes, middleware and plugins, fetching data with `useFetch` and `useAsyncData`, adding or authoring a module, upgrading between major versions, and deploying to a specific provider.',
    'They cover Nuxt itself. For Vue, Vite, Nitro or UnJS APIs, go to their own documentation, and for questions about a specific module, to the module\'s own docs, which the directory links.'
  ]
}

/** How to fetch the documentation, for an agent that has decided to. */
export function agentHowToCall(domain: string): string[] {
  return [
    `Every documentation, blog and deploy page is also Markdown. Append \`.md\` to a URL, or send \`Accept: text/markdown\` on the HTML one. <${domain}/llms-full.txt> is the whole documentation in a single file, and <${domain}/sitemap.md> lists every page.`,
    `For search and structured lookups, call the MCP server at <${domain}/mcp> (streamable HTTP), described by <${domain}/.well-known/mcp/server-card.json>. The REST endpoints under \`/api/v1\` are public, read-only and need no credentials: the module directory, its health data, and the core and ecosystem teams. <${domain}/openapi.json> describes them.`
  ]
}
