import { z } from 'zod'
import { fetchAgentObservabilityStats, ObservabilityAuthError } from '../../../../agent/lib/vercel-workflow'

export default defineMcpTool({
  description: `Live Eve agent runs from Vercel Observability: session counts, tokens, breakdown by channel/trigger (slack, http, future connectors), and recent run links.

Use this for traffic and tokens across all channels. Use \`agent-usage-stats\` for persisted web chats and vote quality only.`,
  inputSchema: {
    sinceDays: z.number().int().min(1).max(90).default(7).describe('Window in days from now (default 7).')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  inputExamples: [
    { sinceDays: 7 },
    { sinceDays: 30 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ sinceDays }) {
    try {
      return await fetchAgentObservabilityStats(sinceDays)
    } catch (error) {
      if (error instanceof ObservabilityAuthError) {
        return {
          error: error.message,
          hint: 'On Vercel, VERCEL_OIDC_TOKEN is injected automatically. Locally, run `vercel env pull` or set WORKFLOW_VERCEL_AUTH_TOKEN.'
        }
      }
      throw error
    }
  }
})
