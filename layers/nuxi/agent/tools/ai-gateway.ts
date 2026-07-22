import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'

export const AI_GATEWAY_INSTRUCTIONS = `**AI Gateway tools (\`ai_gateway__*\`, admin only) — tokens, cost, model usage:**
- \`ai_gateway__credits\` — current credit balance and lifetime spend for the nuxt-js team
- \`ai_gateway__report\` — aggregated spend/tokens over a date range, grouped by day/user/model/tag/provider/credential type
- \`ai_gateway__generation\` — cost, latency, and token usage for a single generation id (from a chat completion's \`id\` field)
- Dashboard: https://vercel.com/nuxt-js/nuxt/ai-gateway`

const BASE_URL = 'https://ai-gateway.vercel.sh/v1'

function apiKey(): string {
  const key = process.env.AI_GATEWAY_API_KEY?.trim()
  if (!key) throw new Error('AI_GATEWAY_API_KEY is not configured')
  return key
}

async function gatewayFetch(path: string, params: Record<string, string | undefined> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey()}` }
  })

  if (!response.ok) {
    throw new Error(`AI Gateway API error (${response.status}): ${await response.text()}`)
  }

  return await response.json()
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

function aiGatewayTools() {
  return {
    credits: defineTool({
      description: 'Admin: AI Gateway credit balance and lifetime spend for the nuxt-js team.',
      inputSchema: z.object({}),
      async execute() {
        return await gatewayFetch('/credits')
      }
    }),
    report: defineTool({
      description: 'Admin: aggregated AI Gateway spend and token usage over a date range. Requires a paid plan.',
      inputSchema: z.object({
        startDate: dateSchema.describe('Start date (UTC, inclusive), YYYY-MM-DD'),
        endDate: dateSchema.describe('End date (UTC, inclusive), YYYY-MM-DD'),
        groupBy: z.enum(['day', 'user', 'model', 'tag', 'provider', 'credential_type', 'zero_data_retention', 'api_key_name']).default('day'),
        datePart: z.enum(['day', 'hour']).optional().describe('Time granularity, only applies when groupBy is "day"'),
        userId: z.string().optional(),
        model: z.string().optional().describe('creator/model-name, e.g. anthropic/claude-sonnet-4.6'),
        provider: z.string().optional(),
        credentialType: z.enum(['byok', 'system']).optional(),
        tags: z.array(z.string()).optional(),
        tagsMatch: z.enum(['any', 'all']).optional()
      }),
      async execute(input) {
        return await gatewayFetch('/report', {
          start_date: input.startDate,
          end_date: input.endDate,
          group_by: input.groupBy,
          date_part: input.datePart,
          user_id: input.userId,
          model: input.model,
          provider: input.provider,
          credential_type: input.credentialType,
          tags: input.tags?.join(','),
          tags_match: input.tagsMatch
        })
      }
    }),
    generation: defineTool({
      description: 'Admin: cost, latency, and token usage for a single AI Gateway generation id.',
      inputSchema: z.object({
        id: z.string().min(1).describe('Generation id, e.g. gen_01ARZ3NDEKTSV4RRFFQ69G5FAV')
      }),
      async execute(input) {
        return await gatewayFetch('/generation', { id: input.id })
      }
    })
  }
}

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!canAccessAdminMcp(ctx.session.auth.current)) return null
      return aiGatewayTools()
    }
  }
})
