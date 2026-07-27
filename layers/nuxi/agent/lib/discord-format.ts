import { EmojiResolver, type EmojiFormats } from 'chat'

// `EmojiResolver.extend()` is typed against `chat`'s `Emoji` union
// (`WellKnownEmoji | keyof CustomEmojiMap`) — module augmentation is the
// SDK's documented way to add names beyond the well-known set.
declare module 'chat' {
  interface CustomEmojiMap {
    'robot_face': EmojiFormats
    'hammer_and_wrench': EmojiFormats
    'bar_chart': EmojiFormats
    'rotating_light': EmojiFormats
    'compass': EmojiFormats
    'nuxi': EmojiFormats
    'nuxter': EmojiFormats
    'nuxt_cool': EmojiFormats
    'nuxt-intensifies': EmojiFormats
    'nuxt_lurk': EmojiFormats
  }
}

/**
 * Slack-first digest/live text → Discord Markdown.
 * Used by live Discord replies and by the scheduled digest mirror
 * (`discord-workflow.ts`) so we don't pay for a second model run.
 *
 * `chat`'s emoji map already covers several shortcodes our skills use
 * (`red_circle`, `white_check_mark`, …); this extends the rest + Nuxt customs
 * (`.gchat` is the Discord unicode fallback).
 */
const emoji = new EmojiResolver()
emoji.extend({
  'robot_face': { slack: 'robot_face', gchat: '🤖' },
  'hammer_and_wrench': { slack: 'hammer_and_wrench', gchat: '🛠️' },
  'bar_chart': { slack: 'bar_chart', gchat: '📊' },
  'rotating_light': { slack: 'rotating_light', gchat: '🚨' },
  'compass': { slack: 'compass', gchat: '🧭' },
  'nuxi': { slack: 'nuxi', gchat: '🟩' },
  'nuxter': { slack: 'nuxter', gchat: '💚' },
  'nuxt_cool': { slack: 'nuxt_cool', gchat: '😎' },
  'nuxt-intensifies': { slack: 'nuxt-intensifies', gchat: '⚡' },
  'nuxt_lurk': { slack: 'nuxt_lurk', gchat: '👀' }
})

const SLACK_LABELED_LINK_PATTERN = /<(https?:\/\/[^|>]+)\|([^>]+)>/g
/** Model sometimes drops the `<>` — Discord then auto-links `url|label` as `url%7Clabel`. */
const SLACK_UNBRACKETED_LABELED_LINK_PATTERN = /(?<![<\w])(https?:\/\/[^\s<>|]+)\|([^<>\s|]+)/g
const SLACK_BARE_LINK_PATTERN = /<(https?:\/\/[^>]+)>/g
const EMOJI_SHORTCODE_PATTERN = /:([\w-]+):/g
/**
 * `@chat-adapter/discord` runs `replaceBareMentions`, rewriting `@name` → `<@name>`
 * (broken for handles / owners in digests). ZWSP after `@` makes the next char
 * non-word so the rewriter skips it. Skip emails (`a@b`) and real `<@id>` tokens.
 */
const AT_ZWSP = '@\u200B'
const BARE_AT_PATTERN = /(?<![<\w])@(?!\u200B)(?=\w)/g

function discordLinkLabel(label: string): string {
  return label.startsWith('@') ? `${AT_ZWSP}${label.slice(1)}` : label
}

function discordMaskedLink(url: string, label: string): string {
  // `<url>` inside the markdown link suppresses Discord's link-preview embed.
  return `[${discordLinkLabel(label)}](<${url}>)`
}

function slackLinksToMarkdown(text: string): string {
  return text
    .replace(SLACK_LABELED_LINK_PATTERN, (_match, url: string, label: string) => discordMaskedLink(url, label))
    .replace(SLACK_UNBRACKETED_LABELED_LINK_PATTERN, (_match, url: string, label: string) => discordMaskedLink(url, label))
    .replace(SLACK_BARE_LINK_PATTERN, (_match, url: string) => `<${url}>`)
    // Model-native Discord links with `@handle` labels.
    .replace(/\[@(?!\u200B)([^\]]+)\]\(/g, `[${AT_ZWSP}$1](`)
}

function slackEmojiToDiscord(text: string): string {
  return text.replace(EMOJI_SHORTCODE_PATTERN, (original, name: string) => {
    const converted = emoji.toDiscord(emoji.fromSlack(name))
    return converted === name ? original : converted
  })
}

function escapeBareAts(text: string): string {
  return text.replace(BARE_AT_PATTERN, AT_ZWSP)
}

export function slackTextToDiscord(text: string): string {
  return escapeBareAts(slackEmojiToDiscord(slackLinksToMarkdown(text)))
}

/** Discord hard limit for a single message body. */
export const DISCORD_MESSAGE_MAX_CHARS = 2000

/**
 * Split long digest text into Discord-safe chunks (≤2000 chars).
 * Prefers blank-line section breaks, then newlines, then a hard cut.
 */
export function splitDiscordMessages(
  text: string,
  maxChars: number = DISCORD_MESSAGE_MAX_CHARS
): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.length <= maxChars) return [trimmed]

  const chunks: string[] = []
  let remaining = trimmed
  const minBreak = Math.floor(maxChars * 0.4)

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars)
    const blankBreak = window.lastIndexOf('\n\n')
    const lineBreak = window.lastIndexOf('\n')
    const splitAt = blankBreak >= minBreak
      ? blankBreak
      : lineBreak >= minBreak
        ? lineBreak
        : maxChars

    chunks.push(remaining.slice(0, splitAt).trimEnd())
    remaining = remaining.slice(splitAt).replace(/^\n+/, '')
  }

  if (remaining.trim()) chunks.push(remaining.trim())
  return chunks
}
