import type { GatewayProviderOptions } from '@ai-sdk/gateway'
import type { ModelMessage } from 'ai'
import { isScheduleAppAuth, type AdminMcpAuthContext } from './admin-mcp-access.js'
import { NUXI_GATEWAY_TAG } from '../../shared/utils/ai-gateway.js'

/**
 * Fallback chain for the primary model, only used when the primary fails — the
 * nominal path is unchanged. `claude-sonnet-4.5` accepts the same
 * `thinking.budgetTokens` as 4.6; `gpt-5.4` ignores the `anthropic` provider
 * key and runs with its own default reasoning.
 */
const FALLBACK_MODELS = ['anthropic/claude-sonnet-4.5', 'openai/gpt-5.4']

/** Skill ids a schedule can ask for, so digest spend is attributable per workflow. */
const WORKFLOW_SKILL_IDS = ['weekly-digest', 'firehose-summary'] as const

type Surface = 'web' | 'slack' | 'discord' | 'schedule' | 'unknown'

/**
 * The Chat SDK bridge reports `chat-sdk` as its channel kind, which does not
 * distinguish adapters, so the surface comes from the authenticated principal
 * instead — the same discriminants `canAccessAdminMcp` relies on.
 */
export function resolveSurface(auth: AdminMcpAuthContext | null | undefined): Surface {
  if (!auth) return 'unknown'
  if (isScheduleAppAuth(auth)) return 'schedule'

  const issuer = auth.issuer ?? ''
  if (issuer.startsWith('slack')) return 'slack'
  if (issuer.startsWith('discord')) return 'discord'
  if (issuer === 'nuxt.com') return 'web'
  return 'unknown'
}

/**
 * Schedules dispatch through Slack with an app principal, so the workflow is
 * only identifiable from the prompt — `skillWorkflowMessage` names the skill in
 * the first user message.
 */
function resolveWorkflowSkill(messages: readonly ModelMessage[]): string | undefined {
  const first = messages.find(message => message.role === 'user')
  if (!first) return undefined

  const text = typeof first.content === 'string' ? first.content : JSON.stringify(first.content)
  return WORKFLOW_SKILL_IDS.find(id => text.includes(`\`${id}\``))
}

export function nuxiGatewayTags(
  auth: AdminMcpAuthContext | null | undefined,
  messages: readonly ModelMessage[]
): string[] {
  const surface = resolveSurface(auth)
  const tags = [NUXI_GATEWAY_TAG, `surface:${surface}`]

  if (surface === 'schedule') {
    const skill = resolveWorkflowSkill(messages)
    if (skill) tags.push(`feature:${skill}`)
  }

  return tags
}

/**
 * Per-session gateway options. Returned from the dynamic model resolver, which
 * replaces the agent-level `modelOptions` wholesale — so this has to carry every
 * option the static config would have set.
 */
export function nuxiGatewayOptions(
  auth: AdminMcpAuthContext | null | undefined,
  messages: readonly ModelMessage[]
) {
  // Left unannotated on purpose: `providerOptions` is typed as `JsonObject`,
  // which an interface like `GatewayProviderOptions` cannot satisfy (no
  // implicit index signature). `satisfies` keeps the contract checked instead.
  const options = {
    caching: 'auto',
    models: FALLBACK_MODELS,
    tags: nuxiGatewayTags(auth, messages),
    zeroDataRetention: true
  } satisfies GatewayProviderOptions

  // Gateway-side per-user limits and audit, on top of the daily cap the
  // rate-limit hook enforces in the database. Omitted rather than left
  // undefined, which the JSON boundary rejects.
  const user = auth?.principalId
  return user ? { ...options, user } : options
}
