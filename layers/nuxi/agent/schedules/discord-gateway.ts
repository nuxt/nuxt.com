import { defineSchedule } from 'eve/schedules'
import { bot } from '../channels/discord.js'

/**
 * Discord delivers regular messages (@mentions, thread replies) over a Gateway
 * WebSocket, not HTTP webhooks. The Chat SDK Discord adapter ships a Gateway
 * listener that holds the connection inside a function invocation and forwards
 * events to the channel webhook (`/eve/v1/discord`).
 *
 * This schedule restarts the listener every 4 minutes with a 270s duration
 * (staying under the default 300s function timeout), overlapping windows so
 * coverage is continuous. Inbound dedupe across overlapping listeners relies
 * on the Chat SDK state adapter — use Redis in production.
 *
 * Eve cron schedules only run on the production deployment. On previews,
 * start a listener window manually via `POST /eve/v1/ops/discord-gateway/trigger`
 * (see `channels/ops.ts`).
 */
const LISTENER_DURATION_MS = 270_000

function gatewayWebhookUrl(): string {
  const override = process.env.DISCORD_GATEWAY_WEBHOOK_URL?.trim()
  if (override) return override
  // VERCEL_URL is the deployment-specific domain, so previews forward to
  // themselves instead of production.
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
  if (!process.env.DISCORD_BOT_TOKEN) {
    return { started: false, reason: 'DISCORD_BOT_TOKEN is not set' }
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
    // No-op when Discord is not configured (e.g. previews without the bot).
    await runDiscordGateway({ waitUntil })
  }
})
