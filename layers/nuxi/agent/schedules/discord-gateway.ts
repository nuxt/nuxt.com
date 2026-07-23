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
 */
const LISTENER_DURATION_MS = 270_000

function gatewayWebhookUrl(): string {
  const override = process.env.DISCORD_GATEWAY_WEBHOOK_URL?.trim()
  if (override) return override
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (host) return `https://${host}/eve/v1/discord`
  return 'http://localhost:3000/eve/v1/discord'
}

export default defineSchedule({
  cron: '*/4 * * * *',
  async run({ waitUntil }) {
    // No-op when Discord is not configured (e.g. previews without the bot).
    if (!process.env.DISCORD_BOT_TOKEN) return

    await bot.initialize()
    const discord = bot.getAdapter('discord')
    if (!discord) return

    await discord.startGatewayListener(
      { waitUntil },
      LISTENER_DURATION_MS,
      undefined,
      gatewayWebhookUrl()
    )
  }
})
