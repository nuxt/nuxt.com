import type { Surface } from './context.js'

/**
 * Per-surface behaviour used to ride along as channel `context`, which eve
 * prepends to the turn as user messages — so a long Slack thread accumulated
 * one copy of these blocks per mention. Both are static per surface, so they
 * belong in the always-on prompt instead, resolved once per session from the
 * principal (see `instructions.ts`).
 */
const SLACK_INSTRUCTIONS = `**You are on Slack.**
- **Slack emojis:** When it fits, use our workspace custom emojis (sparingly — 0–2 per message) instead of generic Unicode emoji: :nuxter: (Nuxt logo), :nuxt-intensifies:, :nuxt_lurk:, :nuxt_cool:, :nuxi:. Examples: :nuxter: or :nuxi: for greetings or Nuxt pride; :nuxt_cool: when something works; :nuxt-intensifies: for excitement; :nuxt_lurk: while investigating. Use Slack :colon: syntax exactly as written.`

const DISCORD_INSTRUCTIONS = `**You are on Discord, answering in a thread (like Slack).**
- Keep writing Slack mrkdwn (\`<url|label>\`, \`:emoji:\`) — outbound messages are converted to Discord markdown automatically.
- Use absolute nuxt.com links (\`https://nuxt.com/docs/...\`) — root-relative paths do not render as links.
- Never use \`show_prompt\` here.
- Prefer compact replies — Discord caps a message at 2000 characters, so anything longer is split across follow-up messages.`

const BY_SURFACE: Partial<Record<Surface, string>> = {
  discord: DISCORD_INSTRUCTIONS,
  slack: SLACK_INSTRUCTIONS
}

/**
 * Scheduled workflows dispatch through Slack under the app principal, so they
 * resolve as `schedule` and deliberately get nothing here: their skill already
 * owns the delivery format.
 */
export function surfaceInstructions(surface: Surface): string | undefined {
  return BY_SURFACE[surface]
}
