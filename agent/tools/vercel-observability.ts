import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { fetchAgentObservabilityStats, ObservabilityAuthError } from '../lib/vercel-workflow.js'
import { canAccessAdminMcp } from './admin-mcp.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!canAccessAdminMcp(ctx.session.auth.current)) return null
      return {
        agent_runs_stats: defineTool({
          description: 'Admin: Eve agent runs from Vercel Observability (sessions, tokens, breakdown by channel/trigger — slack, http, etc. — and recent prompts).',
          inputSchema: z.object({
            sinceDays: z.number().int().min(1).max(90).default(7)
          }),
          async execute({ sinceDays }) {
            try {
              return await fetchAgentObservabilityStats(sinceDays)
            } catch (error) {
              if (error instanceof ObservabilityAuthError) {
                return {
                  error: error.message,
                  hint: 'This tool needs Vercel Workflow API access. Deployed Eve uses OIDC; local dev needs `vercel env pull` or WORKFLOW_VERCEL_AUTH_TOKEN.'
                }
              }
              throw error
            }
          }
        })
      }
    }
  }
})
