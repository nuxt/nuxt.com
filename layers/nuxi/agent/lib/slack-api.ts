import { getToken } from '@vercel/connect'
import { slackConnectorId } from './slack-connect.js'

const DEFAULT_WORKFLOW_SLACK_CHANNEL = 'project-nuxi'
const DEFAULT_FIREHOSE_SLACK_CHANNEL = 'firehose-nuxt'
const CHANNEL_LIST_TTL_MS = 60 * 60 * 1000

export interface SlackChannelInfo {
  id: string
  name: string
  isPrivate: boolean
}

export interface ResolvedSlackChannel {
  id: string
  name: string
  ref: string
}

const SLACK_CHANNEL_ID_PATTERN = /^[CG][A-Z0-9]+$/

export function isSlackChannelId(ref: string): boolean {
  return SLACK_CHANNEL_ID_PATTERN.test(ref.trim())
}

export function normalizeSlackChannelName(ref: string): string {
  return ref.trim().replace(/^#/, '').toLowerCase()
}

export function workflowSlackChannelRef(): string {
  return process.env.NUXT_WORKFLOW_SLACK_CHANNEL_ID?.trim()
    || process.env.NUXT_WORKFLOW_SLACK_CHANNEL?.trim()
    || DEFAULT_WORKFLOW_SLACK_CHANNEL
}

export function firehoseSlackChannelRef(): string {
  return process.env.NUXT_FIREHOSE_SLACK_CHANNEL_ID?.trim()
    || process.env.NUXT_FIREHOSE_SLACK_CHANNEL?.trim()
    || DEFAULT_FIREHOSE_SLACK_CHANNEL
}

function slackWorkspace(): string {
  return process.env.NUXT_SLACK_WORKSPACE?.trim() || 'vercel'
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

interface UsersConversationsResponse {
  ok: boolean
  error?: string
  channels?: Array<{
    id?: string
    name?: string
    is_private?: boolean
  }>
  response_metadata?: {
    next_cursor?: string
  }
}

interface ChannelCacheState {
  byName: Map<string, SlackChannelInfo>
  expiresAt: number
}

let channelCache: ChannelCacheState | null = null
let channelIndexInflight: Promise<Map<string, SlackChannelInfo>> | null = null

async function slackBotToken(): Promise<string> {
  return getToken(slackConnectorId(), { subject: { type: 'app' } })
}

function mergeChannelMaps(
  target: Map<string, SlackChannelInfo>,
  source: Map<string, SlackChannelInfo>
): void {
  for (const [name, info] of source) {
    target.set(name, info)
  }
}

async function fetchBotChannelPages(targetName?: string): Promise<Map<string, SlackChannelInfo>> {
  const byName = new Map<string, SlackChannelInfo>()
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({
      types: 'public_channel,private_channel',
      exclude_archived: 'true',
      limit: '200'
    })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`https://slack.com/api/users.conversations?${params}`, {
      headers: { Authorization: `Bearer ${await slackBotToken()}` }
    })

    const data = await response.json() as UsersConversationsResponse
    if (!data.ok) {
      throw new Error(data.error ?? 'Slack users.conversations failed')
    }

    for (const channel of data.channels ?? []) {
      if (!channel.id || !channel.name) continue
      byName.set(channel.name, {
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private ?? false
      })
      if (targetName && channel.name === targetName) {
        return byName
      }
    }

    cursor = data.response_metadata?.next_cursor || undefined
  } while (cursor)

  return byName
}

async function loadBotChannelIndex(targetName?: string): Promise<Map<string, SlackChannelInfo>> {
  if (channelCache && channelCache.expiresAt > Date.now()) {
    if (!targetName || channelCache.byName.has(targetName)) {
      return channelCache.byName
    }
  }

  if (channelIndexInflight) {
    const map = await channelIndexInflight
    if (!targetName || map.has(targetName)) {
      return map
    }
  } else {
    channelIndexInflight = fetchBotChannelPages(targetName)
      .then((map) => {
        if (channelCache && channelCache.expiresAt > Date.now()) {
          mergeChannelMaps(channelCache.byName, map)
        } else {
          channelCache = {
            byName: map,
            expiresAt: Date.now() + CHANNEL_LIST_TTL_MS
          }
        }
        return channelCache.byName
      })
      .finally(() => {
        channelIndexInflight = null
      })

    const map = await channelIndexInflight
    if (!targetName || map.has(targetName)) {
      return map
    }
  }

  const fullMap = await fetchBotChannelPages()
  channelCache = {
    byName: fullMap,
    expiresAt: Date.now() + CHANNEL_LIST_TTL_MS
  }
  return fullMap
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

export async function resolveSlackChannelRef(ref: string): Promise<ResolvedSlackChannel> {
  const trimmed = ref.trim()
  if (!trimmed) {
    throw new Error('Slack channel ref is empty')
  }

  if (isSlackChannelId(trimmed)) {
    return { id: trimmed, name: trimmed, ref: trimmed }
  }

  const name = normalizeSlackChannelName(trimmed)
  const index = await loadBotChannelIndex(name)
  const match = index.get(name)

  if (!match) {
    throw new Error(`Slack channel not found: #${name} (is Nuxi invited?)`)
  }

  return { id: match.id, name: match.name, ref: trimmed }
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
