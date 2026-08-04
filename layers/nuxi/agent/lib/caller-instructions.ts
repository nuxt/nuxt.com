import type { Person } from './context.js'

/**
 * Surfaces the caller's identity to the model. `Context.person` is resolved
 * every turn (`context.ts`) but nothing renders it into the prompt otherwise
 * — a Slack/Discord "who am I?" has no answer without this, since raw auth
 * attributes never appear in the visible transcript.
 */
export function callerInstructions(person: Person | null): string | undefined {
  if (!person) return undefined
  const who = person.name ? `${person.name} (id: ${person.id})` : `id ${person.id}`
  return `**Caller:** ${who}${person.isBot ? ' — a bot/automation, not a human' : ''}`
}
