import { createMcpHandler } from '@nuxtjs/mcp-toolkit/server'
import agentUsageStats from '../../mcp-admin/tools/agent-usage-stats'
import cruxWebVitals from '../../mcp-admin/tools/crux-web-vitals'
import feedbackStats from '../../mcp-admin/tools/feedback-stats'
import getAgentChat from '../../mcp-admin/tools/get-agent-chat'
import listAgentChats from '../../mcp-admin/tools/list-agent-chats'
import listAgentVotes from '../../mcp-admin/tools/list-agent-votes'
import listFeedback from '../../mcp-admin/tools/list-feedback'
import searchConsoleAnalytics from '../../mcp-admin/tools/search-console-analytics'
import searchConsoleInspectUrl from '../../mcp-admin/tools/search-console-inspect-url'
import searchConsoleSitemaps from '../../mcp-admin/tools/search-console-sitemaps'
import reviewAgentChats from '../../mcp-admin/prompts/review-agent-chats'
import seoOpportunities from '../../mcp-admin/prompts/seo-opportunities'
import summarizeFeedback from '../../mcp-admin/prompts/summarize-feedback'
import triageProblematicPages from '../../mcp-admin/prompts/triage-problematic-pages'
import weeklyDigest from '../../mcp-admin/prompts/weekly-digest'

export default createMcpHandler({
  name: 'admin',
  description: 'Authenticated MCP handler for the Nuxt team to query feedback, agent chats, and votes from the production database, Google Search Console data and field Core Web Vitals for nuxt.com.',
  icons: [
    { src: 'https://nuxt.com/icon.png', mimeType: 'image/png', sizes: ['64x64'] }
  ],
  instructions: `You are connected to the Nuxt admin MCP. You can query docs feedback, saved web chat sessions, and per-message votes from the production database, Google Search Console data, and field Core Web Vitals (Chrome UX Report) for nuxt.com.

Tools:
- Feedback: \`feedback-stats\`, \`list-feedback\`
- Agent quality: \`agent-usage-stats\` (web chats + votes only), \`list-agent-chats\`, \`get-agent-chat\`, \`list-agent-votes\`
- Google Search: \`search-console-analytics\` (clicks, impressions, CTR, position), \`search-console-inspect-url\` (indexing of one URL), \`search-console-sitemaps\`
- Performance: \`crux-web-vitals\` (field LCP, INP, CLS from real Chrome users, per page or site, with weekly trend)

**Usage, tokens, cost, duration, and Slack runs** are in Vercel Observability → Agent Runs (nuxt project). Never report token/cost numbers from local DB — they are stale or absent post-Eve.

For recurring tasks, prefer the prompts (\`summarize-feedback\`, \`triage-problematic-pages\`, \`review-agent-chats\`, \`weekly-digest\`, \`seo-opportunities\`) which already chain the right tool calls.

Default to recent data (last 7-30 days) unless the user asks for a longer window. Always include direct links (path / chat id) so the team can drill down on the website.`,
  auth: {
    schemes: ['bearer'],
    validate: ({ token }) => validateMcpAdminToken(token, useEvent())
  },
  onToolCall: call => useNitroApp().hooks.callHook('mcp:tool:called', call),
  tools: [agentUsageStats, cruxWebVitals, feedbackStats, getAgentChat, listAgentChats, listAgentVotes, listFeedback, searchConsoleAnalytics, searchConsoleInspectUrl, searchConsoleSitemaps],
  prompts: [reviewAgentChats, seoOpportunities, summarizeFeedback, triageProblematicPages, weeklyDigest]
})
