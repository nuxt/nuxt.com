import { defineSchedule } from 'eve/schedules'
import { isDiscordConfigured } from '../lib/discord-access.js'

/**
 * Discord delivers regular messages (@mentions, thread replies) over a Gateway
 * WebSocket, not HTTP webhooks. The Chat SDK Discord adapter ships a Gateway
 * listener that holds the connection inside a function invocation and forwards
 * events to the channel webhook (`/eve/v1/discord`).
 *
 * This schedule restarts the listener every 4 minutes with a 270s duration
 * (under the default 300s function timeout), overlapping windows so coverage
 * is continuous. Inbound dedupe across overlapping listeners relies on Redis
 * in production.
 *
 * Eve cron only runs on production. On previews, start a listener via
 * `POST /eve/v1/ops/discord-gateway/trigger` (see `channels/ops.ts`).
 */
const LISTENER_DURATION_MS = 270_000

function gatewayWebhookUrl(): string {
  const override = process.env.DISCORD_GATEWAY_WEBHOOK_URL?.trim()
  if (override) return override
  const host = process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (host) return `https://${host}/eve/v1/discord`
  return 'http://localhost:3000/eve/v1/discord'
}

export async function runDiscordGateway({
  waitUntil,
  durationMs = LISTENER_DURATION_MS
}: {
  waitUntil: (task: Promise<unknown>) => void
  durationMs?: number
}): Promise<{ started: boolean, reason?: string, webhookUrl?: string }> {
  if (!isDiscordConfigured()) {
    return { started: false, reason: 'Discord is not configured (missing DISCORD_* env)' }
  }

  // Dynamic import so Slack-only / digest schedules do not load Discord at boot
  // when this schedule file is imported for type/side-effect reasons alone.
  const { bot } = await import('../channels/discord.js')
  if (!bot) {
    return { started: false, reason: 'Discord channel is disabled' }
  }
  await bot.initialize()
  const discord = bot.getAdapter('discord')
  if (!discord) {
    return { started: false, reason: 'Discord adapter is not configured' }
  }

  const webhookUrl = gatewayWebhookUrl()
  await discord.startGatewayListener({ waitUntil }, durationMs, undefined, webhookUrl)
  return { started: true, webhookUrl }
}

export default defineSchedule({
  cron: '*/4 * * * *',
  async run({ waitUntil }) {
    await runDiscordGateway({ waitUntil })
  }
})
