import { getToken } from '@vercel/connect'
import { callSlackApi } from 'eve/channels/slack'
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

/**
 * Maps the friendly names of our two known channels (workflow, firehose) to
 * their configured ids, so a caller that types the *name* instead of leaving
 * `channel` unset (e.g. an ad-hoc `read_slack_channel_history` call) still
 * resolves without a `users.conversations` lookup. That call needs
 * `channels:read`/`groups:read`, a scope beyond what `conversations.history`
 * itself requires — see slack-channel-history.ts.
 */
function knownSlackChannelAliases(): Map<string, string> {
  const aliases = new Map<string, string>()

  const workflowId = process.env.NUXT_WORKFLOW_SLACK_CHANNEL_ID?.trim()
  if (workflowId) {
    const workflowName = process.env.NUXT_WORKFLOW_SLACK_CHANNEL?.trim() || DEFAULT_WORKFLOW_SLACK_CHANNEL
    aliases.set(normalizeSlackChannelName(workflowName), workflowId)
  }

  const firehoseId = process.env.NUXT_FIREHOSE_SLACK_CHANNEL_ID?.trim()
  if (firehoseId) {
    const firehoseName = process.env.NUXT_FIREHOSE_SLACK_CHANNEL?.trim() || DEFAULT_FIREHOSE_SLACK_CHANNEL
    aliases.set(normalizeSlackChannelName(firehoseName), firehoseId)
  }

  return aliases
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
  image_url?: string
  thumb_url?: string
  text?: string
  pretext?: string
  title?: string
  footer?: string
  /** Legacy interactive attachments (link buttons). */
  actions?: Array<{ url?: string, text?: string }>
  blocks?: unknown[]
}

export interface SlackHistoryMessage {
  ts: string
  text: string
  permalink: string
  links: string[]
  /** X post URLs for "view on X": `https://x.com/<handle>/status/<id>` and/or `https://t.co/…`. */
  tweetUrls: string[]
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
    /** Block Kit payload — Octolens puts the real "See post" tweet URL on a button here. */
    blocks?: unknown[]
  }>
}

interface SlackUserInfoResponse {
  ok: boolean
  error?: string
  user?: {
    name?: string
    real_name?: string
    profile?: {
      display_name?: string
      real_name?: string
    }
  }
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

function slackBotToken(): Promise<string> {
  return getToken(slackConnectorId(), { subject: { type: 'app' } })
}

/** Eve's `callSlackApi` signs and form-encodes the request; callers check `ok`. */
async function slackApi<T>(operation: string, body: Record<string, unknown>): Promise<T> {
  return await callSlackApi({ botToken: slackBotToken, operation, body }) as T
}

async function fetchBotChannelPages(): Promise<Map<string, SlackChannelInfo>> {
  const byName = new Map<string, SlackChannelInfo>()
  let cursor: string | undefined

  do {
    const data = await slackApi<UsersConversationsResponse>('users.conversations', {
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
      ...(cursor ? { cursor } : {})
    })

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
    }

    cursor = data.response_metadata?.next_cursor || undefined
  } while (cursor)

  return byName
}

async function loadBotChannelIndex(): Promise<Map<string, SlackChannelInfo>> {
  if (channelCache && channelCache.expiresAt > Date.now()) {
    return channelCache.byName
  }

  if (!channelIndexInflight) {
    channelIndexInflight = fetchBotChannelPages()
      .then((map) => {
        channelCache = {
          byName: map,
          expiresAt: Date.now() + CHANNEL_LIST_TTL_MS
        }
        return map
      })
      .finally(() => {
        channelIndexInflight = null
      })
  }

  return channelIndexInflight
}

const USER_NAME_TTL_MS = 60 * 60 * 1000

interface UserNameCacheEntry {
  name: string | undefined
  expiresAt: number
}

const userNameCache = new Map<string, UserNameCacheEntry>()

/**
 * Real display name for a Slack user id, via `users.info` — the raw
 * `app_mention`/`message` event only carries the id, so without this
 * `context.ts`'s `person.name` (and "who am I?") has nothing to show beyond
 * the id. Cached per user for an hour; a failed lookup (missing `users:read`
 * scope, deleted user, ...) caches `undefined` for the same window rather
 * than retrying every message.
 */
export async function resolveSlackUserName(userId: string): Promise<string | undefined> {
  const cached = userNameCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.name

  let name: string | undefined
  try {
    const data = await slackApi<SlackUserInfoResponse>('users.info', { user: userId })
    name = data.ok
      ? (data.user?.profile?.display_name || data.user?.profile?.real_name || data.user?.real_name || data.user?.name || undefined)
      : undefined
    if (!data.ok) console.warn('[nuxi:slack] users.info failed', { userId, error: data.error })
  } catch (error) {
    console.warn('[nuxi:slack] users.info lookup failed', { userId, error })
  }

  userNameCache.set(userId, { name, expiresAt: Date.now() + USER_NAME_TTL_MS })
  return name
}

const HTTP_URL_KEYS = new Set([
  'url',
  'title_link',
  'from_url',
  'original_url',
  'image_url',
  'thumb_url',
  'permalink'
])

/** Pull http(s) URLs out of Slack mrkdwn / bare text. */
function addUrlsFromText(text: string, into: Set<string>) {
  for (const match of text.matchAll(/<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/g)) {
    into.add(match[1]!)
  }
  for (const match of text.matchAll(/(?<![<|])https?:\/\/[^\s<>|]+/g)) {
    into.add(match[0]!.replace(/[>)]+$/, ''))
  }
}

/**
 * Walk Block Kit / attachment JSON for link buttons and nested mrkdwn.
 * Octolens only puts the author profile in `text`; the real status URL lives
 * on an actions button ("See post") inside `blocks`.
 */
function addUrlsFromValue(value: unknown, into: Set<string>, depth = 0) {
  if (value == null || depth > 12) return

  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      into.add(value.replace(/[>)]+$/, ''))
    } else if (value.includes('http')) {
      addUrlsFromText(value, into)
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) addUrlsFromValue(item, into, depth + 1)
    return
  }

  if (typeof value !== 'object') return

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (HTTP_URL_KEYS.has(key) && typeof child === 'string' && /^https?:\/\//i.test(child)) {
      into.add(child)
      continue
    }
    // Skip bulky non-URL blobs (ids, styles, emoji maps).
    if (key === 'id' || key === 'block_id' || key === 'action_id' || key === 'style') continue
    addUrlsFromValue(child, into, depth + 1)
  }
}

export function extractLinks(
  text: string,
  attachments: SlackAttachment[] = [],
  blocks: unknown[] = []
): string[] {
  const links = new Set<string>()

  addUrlsFromText(text, links)
  addUrlsFromValue(blocks, links)

  for (const attachment of attachments) {
    for (const url of [
      attachment.title_link,
      attachment.from_url,
      attachment.original_url,
      attachment.image_url,
      attachment.thumb_url
    ]) {
      if (url) links.add(url)
    }
    for (const field of [attachment.text, attachment.pretext, attachment.title, attachment.footer]) {
      if (field) addUrlsFromText(field, links)
    }
    for (const action of attachment.actions ?? []) {
      if (action.url) links.add(action.url)
    }
    if (attachment.blocks?.length) addUrlsFromValue(attachment.blocks, links)
  }

  return [...links]
}

/**
 * Filters `links` down to post URLs for "view on X":
 * - `…/status/<id>` on x.com / twitter.com → `https://x.com/<handle>/status/<id>`
 * - `t.co/…` short links (Octolens often only surfaces these, not the expanded status URL)
 *
 * Dedupes by status id / t.co path. Prefers a handle form over `/i/web/status/<id>`.
 */
export function extractTweetUrls(links: string[]): string[] {
  const byStatusId = new Map<string, string>()
  const tcoLinks: string[] = []
  const seenTco = new Set<string>()

  for (const link of links) {
    let url: URL
    try {
      url = new URL(link)
    } catch {
      continue
    }

    const host = url.hostname.replace(/^(?:www|mobile)\./i, '').toLowerCase()

    if (host === 't.co') {
      const path = url.pathname.replace(/\/$/, '')
      if (path.length > 1) {
        const normalized = `https://t.co${path}`
        if (!seenTco.has(normalized)) {
          seenTco.add(normalized)
          tcoLinks.push(normalized)
        }
      }
      continue
    }

    if (host !== 'x.com' && host !== 'twitter.com') continue

    // `/handle/status/id` or `/i/web/status/id`
    const statusMatch = url.pathname.match(/^\/(?:i\/web|([^/?#]+))\/status\/(\d+)/i)
    if (!statusMatch) continue

    const handle = statusMatch[1]
    const statusId = statusMatch[2]!
    const normalized = handle
      ? `https://x.com/${handle}/status/${statusId}`
      : `https://x.com/i/web/status/${statusId}`

    const existing = byStatusId.get(statusId)
    // Prefer the handle form when we already stored an /i/web/ fallback.
    if (!existing || (handle && existing.includes('/i/web/'))) {
      byStatusId.set(statusId, normalized)
    }
  }

  const statusUrls = [...byStatusId.values()]
  // Prefer real status URLs; keep t.co only when we have nothing better
  // (same firehose message often has both).
  return statusUrls.length > 0 ? statusUrls : tcoLinks
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

  const knownId = knownSlackChannelAliases().get(name)
  if (knownId) {
    return { id: knownId, name, ref: trimmed }
  }

  const index = await loadBotChannelIndex()
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
  const data = await slackApi<SlackHistoryResponse>('conversations.history', {
    channel: channelId,
    oldest,
    limit: Math.min(limit, 200),
    inclusive: true
  })

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
      const blocks = message.blocks ?? []

      const links = extractLinks(text, attachments, blocks)
      return {
        ts,
        text,
        permalink: slackMessagePermalink(channelId, ts),
        links,
        tweetUrls: extractTweetUrls(links),
        user: message.user,
        bot_id: message.bot_id
      }
    })
    .reverse()
}
