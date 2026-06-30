import { getToken } from '@vercel/connect'
import { slackConnectorId } from './slack-connect.js'

const DEFAULT_FIREHOSE_CHANNEL_ID = 'C095A7X8ARJ' // #firehose-nuxt

export function firehoseSlackChannelId(): string {
  return process.env.NUXT_FIREHOSE_SLACK_CHANNEL_ID?.trim() || DEFAULT_FIREHOSE_CHANNEL_ID
}

function slackWorkspace(): string {
  return process.env.NUXT_SLACK_WORKSPACE?.trim() || 'nuxt'
}

export function slackMessagePermalink(channelId: string, ts: string): string {
  return `https://${slackWorkspace()}.slack.com/archives/${channelId}/p${ts.replace('.', '')}`
}

interface SlackAttachment {
  title_link?: string
  from_url?: string
  original_url?: string
  text?: string
}

export interface SlackHistoryMessage {
  ts: string
  text: string
  permalink: string
  links: string[]
  user?: string
  bot_id?: string
}

interface SlackHistoryResponse {
  ok: boolean
  error?: string
  messages?: Array<{
    ts?: string
    text?: string
    user?: string
    bot_id?: string
    subtype?: string
    attachments?: SlackAttachment[]
  }>
}

function extractLinks(text: string, attachments: SlackAttachment[] = []): string[] {
  const links = new Set<string>()

  for (const match of text.matchAll(/<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/g)) {
    links.add(match[1]!)
  }
  for (const match of text.matchAll(/(?<![<|])https?:\/\/[^\s<>|]+/g)) {
    links.add(match[0]!.replace(/[>)]+$/, ''))
  }
  for (const attachment of attachments) {
    for (const url of [attachment.title_link, attachment.from_url, attachment.original_url]) {
      if (url) links.add(url)
    }
    if (attachment.text) {
      for (const match of attachment.text.matchAll(/<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/g)) {
        links.add(match[1]!)
      }
    }
  }

  return [...links]
}

async function slackBotToken(): Promise<string> {
  return getToken(slackConnectorId(), { subject: { type: 'app' } })
}

export async function fetchSlackChannelHistory({
  channelId,
  sinceHours,
  limit = 200
}: {
  channelId: string
  sinceHours: number
  limit?: number
}): Promise<SlackHistoryMessage[]> {
  const oldest = String(Math.floor((Date.now() - sinceHours * 3_600_000) / 1000))
  const params = new URLSearchParams({
    channel: channelId,
    oldest,
    limit: String(Math.min(limit, 200)),
    inclusive: 'true'
  })

  const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: { Authorization: `Bearer ${await slackBotToken()}` }
  })

  const data = await response.json() as SlackHistoryResponse
  if (!data.ok) {
    throw new Error(data.error ?? 'Slack conversations.history failed')
  }

  return (data.messages ?? [])
    .filter((message) => {
      if (!message.text?.trim()) return false
      if (message.subtype === 'channel_join' || message.subtype === 'channel_leave') return false
      return true
    })
    .map((message) => {
      const ts = message.ts!
      const text = message.text!.trim()
      const attachments = message.attachments ?? []

      return {
        ts,
        text,
        permalink: slackMessagePermalink(channelId, ts),
        links: extractLinks(text, attachments),
        user: message.user,
        bot_id: message.bot_id
      }
    })
    .reverse()
}
