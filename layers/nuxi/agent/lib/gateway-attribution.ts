import type { GatewayProviderOptions } from '@ai-sdk/gateway'
import type { ModelMessage } from 'ai'
import { isScheduleAppAuth, type AdminMcpAuthContext } from './admin-mcp-access.js'
import { workflowSkillId } from './workflows.js'
import { NUXI_GATEWAY_TAG } from '../../shared/utils/ai-gateway.js'

// Every entry must be ZDR-attested (verify with a live request, not the catalog).
const FALLBACK_MODELS = ['anthropic/claude-sonnet-4.6']

type Surface = 'web' | 'slack' | 'discord' | 'schedule' | 'unknown'

// Channel kind doesn't distinguish adapters, so surface comes from the principal instead.
export function resolveSurface(auth: AdminMcpAuthContext | null | undefined): Surface {
  if (!auth) return 'unknown'
  if (isScheduleAppAuth(auth)) return 'schedule'

  const issuer = auth.issuer ?? ''
  if (issuer.startsWith('slack')) return 'slack'
  if (issuer.startsWith('discord')) return 'discord'
  if (issuer === 'nuxt.com') return 'web'
  return 'unknown'
}

// Schedules dispatch via Slack with an app principal, so the skill is only
// identifiable from the first user message.
function resolveWorkflowSkill(messages: readonly ModelMessage[]): string | undefined {
  const first = messages.find(message => message.role === 'user')
  if (!first) return undefined

  const text = typeof first.content === 'string' ? first.content : JSON.stringify(first.content)
  return workflowSkillId(text)
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

// Replaces the agent-level `modelOptions` wholesale, so it must carry every option.
export function nuxiGatewayOptions(
  auth: AdminMcpAuthContext | null | undefined,
  messages: readonly ModelMessage[]
) {
  // `satisfies` instead of an annotation: `providerOptions` is `JsonObject`,
  // which `GatewayProviderOptions` can't satisfy directly.
  const options = {
    caching: 'auto',
    models: FALLBACK_MODELS,
    tags: nuxiGatewayTags(auth, messages),
    zeroDataRetention: true
  } satisfies GatewayProviderOptions

  // Omitted rather than undefined, which the JSON boundary rejects.
  const user = auth?.principalId
  return user ? { ...options, user } : options
}
