import { getMcpPrompts, getMcpTools } from '@nuxtjs/mcp-toolkit/server'

export default defineMcpHandler({
  name: 'admin',
  description: 'Authenticated MCP handler for the Nuxt team to query feedback, agent chats, and votes from the production database.',
  icons: [
    { src: 'https://nuxt.com/icon.png', mimeType: 'image/png', sizes: ['64x64'] }
  ],
  instructions: `You are connected to the Nuxt admin MCP. You can query docs feedback, saved web chat sessions, and per-message votes from the production database.

Tools:
- Feedback: \`feedback-stats\`, \`list-feedback\`
- Agent quality: \`agent-usage-stats\` (web chats + votes only), \`list-agent-chats\`, \`get-agent-chat\`, \`list-agent-votes\`

**Usage, tokens, cost, duration, and Slack runs** are in Vercel Observability → Agent Runs (nuxt project). Never report token/cost numbers from local DB — they are stale or absent post-Eve.

For recurring tasks, prefer the prompts (\`summarize-feedback\`, \`triage-problematic-pages\`, \`review-agent-chats\`, \`weekly-digest\`) which already chain the right tool calls.

Default to recent data (last 7-30 days) unless the user asks for a longer window. Always include direct links (path / chat id) so the team can drill down on the website.`,
  middleware: (event) => {
    requireMcpAdminToken(event)
  },
  tools: event => getMcpTools({ event, group: 'admin' }),
  prompts: event => getMcpPrompts({ event, group: 'admin' })
})
