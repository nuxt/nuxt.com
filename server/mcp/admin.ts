import { getMcpPrompts, getMcpTools } from '@nuxtjs/mcp-toolkit/server'

export default defineMcpHandler({
  name: 'admin',
  description: 'Authenticated MCP handler for the Nuxt team to query feedback, agent chats, votes and template checks from the production database, Google Search Console data and field Core Web Vitals for nuxt.com.',
  icons: [
    { src: 'https://nuxt.com/icon.png', mimeType: 'image/png', sizes: ['64x64'] }
  ],
  instructions: `You are connected to the Nuxt admin MCP. You can query docs feedback, saved web chat sessions, and per-message votes from the production database, Google Search Console data, and field Core Web Vitals (Chrome UX Report) for nuxt.com.

Tools:
- Feedback: \`feedback-stats\`, \`list-feedback\`
- Agent quality: \`agent-usage-stats\` (web chats + votes only), \`list-agent-chats\`, \`get-agent-chat\`, \`list-agent-votes\`
- Google Search: \`search-console-analytics\` (clicks, impressions, CTR, position), \`search-console-inspect-url\` (indexing of one URL), \`search-console-sitemaps\`
- Performance: \`crux-web-vitals\` (field LCP, INP, CLS from real Chrome users, per page or site, with weekly trend)
- Templates: \`template-check-status\` (which templates pass the daily check, and why they fail), \`start-template-checks\` (re-check some of them on Vercel Sandbox: pass \`slugs\` or \`failing\`, each one runs a sandbox for up to 15 minutes)

**Usage, tokens, cost, duration, and Slack runs** are in Vercel Observability → Agent Runs (nuxt project). Never report token/cost numbers from local DB — they are stale or absent post-Eve.

For recurring tasks, prefer the prompts (\`summarize-feedback\`, \`triage-problematic-pages\`, \`review-agent-chats\`, \`weekly-digest\`, \`seo-opportunities\`) which already chain the right tool calls.

Default to recent data (last 7-30 days) unless the user asks for a longer window. Always include direct links (path / chat id) so the team can drill down on the website.`,
  middleware: (event) => {
    requireMcpAdminToken(event)
  },
  tools: event => getMcpTools({ event, group: 'admin' }),
  prompts: event => getMcpPrompts({ event, group: 'admin' })
})
