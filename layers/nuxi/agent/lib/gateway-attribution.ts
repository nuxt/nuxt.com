import type { GatewayProviderOptions } from '@ai-sdk/gateway'
import type { ModelMessage } from 'ai'
import type { AdminMcpAuthContext } from './admin-mcp-access.js'
import { resolveContext } from './context.js'
import { workflowSkillId } from './workflows.js'
import { NUXI_GATEWAY_TAG } from '../../shared/utils/ai-gateway.js'

/**
 * Fallback chain for the primary model, only used when the primary fails — the
 * nominal path is unchanged. `claude-sonnet-4.5` accepts the same
 * `thinking.budgetTokens` as 4.6; `gemini-3.6-flash` ignores the `anthropic`
 * provider key and runs with its own default reasoning.
 *
 * Both links are probed against the team's Gateway under `zeroDataRetention`,
 * which every request below sets: a model with no ZDR-attested provider throws
 * rather than degrading, so an unverified fallback is worse than none. OpenAI
 * has no ZDR provider on this account at all, which is why `gpt-5.4` sat here
 * and could never have engaged. Nothing in the model catalog lets you check
 * this statically — `regions` reads like it should and does not.
 */
const FALLBACK_MODELS = ['anthropic/claude-sonnet-4.5', 'google/gemini-3.6-flash']

/**
 * Schedules dispatch through Slack with an app principal, so the workflow is
 * only identifiable from the prompt — `skillWorkflowMessage` names the skill in
 * the first user message. Reading it back rather than matching a list of ids
 * means a new schedule is attributed without touching this file.
 */
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
  const surface = resolveContext(auth).surface
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
