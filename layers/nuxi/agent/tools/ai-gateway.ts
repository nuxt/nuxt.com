import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { NUXI_GATEWAY_TAG } from '../../shared/utils/ai-gateway.js'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'

export const AI_GATEWAY_INSTRUCTIONS = `**AI Gateway tools (\`ai_gateway__*\`, admin only) — tokens, cost, model usage:**
- \`ai_gateway__credits\` — current credit balance and lifetime spend for the **entire** nuxt-js team account (not Nuxi-only)
- \`ai_gateway__report\` — spend/tokens over a date range. The Custom Reporting API is **account-wide**; this tool always scopes to Nuxi via tags (default \`${NUXI_GATEWAY_TAG}\`) and/or \`AI_GATEWAY_REPORT_API_KEY_NAME\`. Never quote unscoped account totals in digests.
- \`ai_gateway__generation\` — cost, latency, and token usage for a single generation id (from a chat completion's \`id\` field)
- Every Nuxi request also carries \`surface:web\` | \`surface:slack\` | \`surface:discord\` | \`surface:schedule\` | \`surface:eval\`, plus \`feature:<name>\` on scheduled workflows and background jobs. Use \`groupBy=tag\` to break spend down per channel — note traffic before this rolled out only has \`${NUXI_GATEWAY_TAG}\`.
- Dashboard: https://vercel.com/nuxt-js/nuxt/ai-gateway
- If a scoped report returns empty results (e.g. before tagging rolled out and no API key name configured), say spend is not attributable yet — do **not** fall back to account-wide totals.`

const BASE_URL = 'https://ai-gateway.vercel.sh/v1'
const FETCH_TIMEOUT_MS = 10_000

function apiKey(): string {
  const key = process.env.AI_GATEWAY_API_KEY?.trim()
  if (!key) throw new Error('AI_GATEWAY_API_KEY is not configured')
  return key
}

/**
 * Comma-separated tags from env, or the default Nuxi attribution tag. Never
 * empty: an empty `tags` param on the Custom Reporting call is not "no match",
 * it's "no filter" — the account-wide, unscoped totals this tool exists to
 * prevent. A misconfigured env var (e.g. all commas/whitespace) falls back to
 * the default tag instead of silently widening the scope.
 */
function defaultReportTags(): string[] {
  const raw = process.env.AI_GATEWAY_REPORT_TAGS?.trim()
  if (!raw) return [NUXI_GATEWAY_TAG]
  const tags = raw.split(',').map(t => t.trim()).filter(Boolean)
  return tags.length ? tags : [NUXI_GATEWAY_TAG]
}

function reportApiKeyName(): string | undefined {
  return process.env.AI_GATEWAY_REPORT_API_KEY_NAME?.trim() || undefined
}

async function gatewayFetch(path: string, params: Record<string, string | undefined> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey()}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`AI Gateway API error (${response.status}): ${await response.text()}`)
  }

  return await response.json()
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

type ReportRow = Record<string, unknown> & {
  api_key_name?: string
}

function filterReportByApiKeyName(payload: unknown, apiKeyName: string): {
  results: ReportRow[]
  matchedRows: number
  note: string
} {
  const results = payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)
    ? (payload as { results: ReportRow[] }).results
    : []

  const needle = apiKeyName.toLowerCase()
  const filtered = results.filter(
    row => typeof row.api_key_name === 'string' && row.api_key_name.toLowerCase() === needle
  )

  return {
    results: filtered,
    matchedRows: filtered.length,
    note: filtered.length === 0
      ? `No rows matched AI_GATEWAY_REPORT_API_KEY_NAME="${apiKeyName}". Do not quote account-wide totals.`
      : `Filtered to API key "${apiKeyName}" only.`
  }
}

function aiGatewayTools() {
  return {
    credits: defineTool({
      description: 'Admin: AI Gateway credit balance and lifetime spend for the entire nuxt-js team account (not Nuxi-scoped). Prefer ai_gateway__report for Nuxi digests.',
      inputSchema: z.object({}),
      async execute() {
        return await gatewayFetch('/credits')
      }
    }),
    report: defineTool({
      description: `Admin: Nuxi-scoped AI Gateway spend/tokens over a date range. Scopes via AI_GATEWAY_REPORT_API_KEY_NAME (preferred for historical) and/or tags (default ${NUXI_GATEWAY_TAG}). Never returns unscoped account totals.`,
      inputSchema: z.object({
        startDate: dateSchema.describe('Start date (UTC, inclusive), YYYY-MM-DD'),
        endDate: dateSchema.describe('End date (UTC, inclusive), YYYY-MM-DD'),
        groupBy: z.enum(['day', 'user', 'model', 'tag', 'provider', 'credential_type', 'zero_data_retention', 'api_key_name']).optional().describe('Defaults to "api_key_name" when AI_GATEWAY_REPORT_API_KEY_NAME is configured, otherwise "model". Requesting one explicitly forces tag scoping, since key-name scoping needs the grouping for itself.'),
        datePart: z.enum(['day', 'hour']).optional().describe('Time granularity, only applies when groupBy is "day"'),
        userId: z.string().optional(),
        model: z.string().optional().describe('creator/model-name, e.g. anthropic/claude-sonnet-4.6'),
        provider: z.string().optional(),
        credentialType: z.enum(['byok', 'system']).optional(),
        tags: z.array(z.string()).optional().describe(`Override default report tags (env AI_GATEWAY_REPORT_TAGS / ${NUXI_GATEWAY_TAG}). Ignored while key-name scoping applies, i.e. AI_GATEWAY_REPORT_API_KEY_NAME is set and no groupBy was requested.`),
        tagsMatch: z.enum(['any', 'all']).optional()
      }).refine(({ startDate, endDate }) => startDate <= endDate, {
        message: 'startDate must not be later than endDate',
        path: ['startDate']
      }),
      async execute(input) {
        const configuredKeyName = reportApiKeyName()
        // Key-name scope covers historical untagged traffic on a dedicated Nuxi
        // key, but it spends the single `group_by` slot on `api_key_name` to do
        // it. So it only applies while the caller leaves the grouping open — an
        // explicit `groupBy` has to win, otherwise the digest asking for `tag` to
        // break spend down per surface would quietly get key-name rows instead.
        const keyNameScope = input.groupBy ? undefined : configuredKeyName
        const groupBy = keyNameScope ? 'api_key_name' : (input.groupBy ?? 'model')

        // Tags are how requests are attributed going forward (app:nuxi, surface:*).
        const tags = keyNameScope
          ? undefined
          : (input.tags?.length ? input.tags : defaultReportTags())
        const tagsMatch = tags ? (input.tagsMatch ?? 'all') : undefined

        const payload = await gatewayFetch('/report', {
          start_date: input.startDate,
          end_date: input.endDate,
          group_by: groupBy,
          date_part: input.datePart,
          user_id: input.userId,
          model: input.model,
          provider: input.provider,
          credential_type: input.credentialType,
          tags: tags?.join(','),
          tags_match: tagsMatch
        })

        if (keyNameScope) {
          const { results, matchedRows, note } = filterReportByApiKeyName(payload, keyNameScope)
          return {
            results,
            scope: {
              mode: 'api_key_name' as const,
              apiKeyName: configuredKeyName,
              matchedRows,
              groupBy,
              note: `${note} Custom Reporting is account-wide; empty results mean no attributable Nuxi spend — do not invent or fall back to team totals.`
            }
          }
        }

        const results = payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)
          ? (payload as { results: unknown[] }).results
          : []

        return {
          results,
          scope: {
            mode: 'tags' as const,
            tags,
            tagsMatch,
            groupBy,
            matchedRows: results.length,
            note: configuredKeyName
              ? `Scoped by tags, not by API key "${configuredKeyName}", because groupBy="${groupBy}" was requested and key-name scoping needs the grouping for itself. Spend predating tagging is out of scope here; omit groupBy for the full historical figure. Do not fall back to account-wide totals.`
              : 'Scoped by tags only. Empty results usually mean traffic predates app:nuxi tagging (or set AI_GATEWAY_REPORT_API_KEY_NAME). Do not fall back to account-wide totals.'
          }
        }
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
