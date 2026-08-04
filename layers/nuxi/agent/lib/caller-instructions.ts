import type { Person } from './context.js'

/** Renders `Context.person` into the prompt so "who am I?" has an answer — raw auth attributes never reach the transcript otherwise. */
export function callerInstructions(person: Person | null): string | undefined {
  if (!person) return undefined
  const who = person.name ? `${person.name} (id: ${person.id})` : `id ${person.id}`
  return `**Caller:** ${who}${person.isBot ? ' — a bot/automation, not a human' : ''}`
}
