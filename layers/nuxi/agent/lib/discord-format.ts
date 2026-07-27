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
 * Converts the Slack-formatted digest text produced by
 * `agent/skills/weekly-digest` and `agent/skills/firehose-summary` into
 * Discord-friendly Markdown, so the single Slack-generated message can be
 * mirrored to Discord without running the skill (and paying for the model
 * call) a second time. See `agent/lib/discord-workflow.ts`.
 *
 * Also used as a safety net on live Discord replies: skills are Slack-first
 * and often emit `<url|label>`, which Discord treats as a bare URL and shows
 * with a literal `%7C` instead of a masked link.
 *
 * `chat`'s built-in emoji map already covers some of the shortcodes our
 * skills use (`red_circle`, `white_check_mark`, `page_facing_up`,
 * `speech_balloon`, `large_yellow_circle`, `large_green_circle`) — this
 * extends it with the ones that aren't, plus Nuxt's five custom workspace
 * emoji (`.gchat` doubles as the Discord unicode fallback).
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
/** `@chat-adapter/discord` rewrites bare `@name` → `<@name>`; ZWSP after `@` blocks that inside link labels. */
const AT_ZWSP = '@\u200B'

function discordLinkLabel(label: string): string {
  return label.startsWith('@') ? `${AT_ZWSP}${label.slice(1)}` : label
}

function discordMaskedLink(url: string, label: string): string {
  return `[${discordLinkLabel(label)}](<${url}>)`
}

/**
 * `<url|label>` -> `[label](<url>)`; a bare `<url>` -> `<url>` (unchanged).
 *
 * The digest links to several pages per section (Agent Runs, AI Gateway,
 * Vercel Observability, docs pages, …) — with a plain `[label](url)`
 * Discord still auto-unfurls every one of those into a big image/title
 * embed card below the message, which buries the actual digest text.
 * Wrapping the URL itself in `<>` (inside or outside the masked-link
 * parens) is Discord's own syntax for keeping a link clickable while
 * suppressing that embed.
 */
function slackLinksToMarkdown(text: string): string {
  return text
    .replace(SLACK_LABELED_LINK_PATTERN, (_match, url: string, label: string) => discordMaskedLink(url, label))
    .replace(SLACK_UNBRACKETED_LABELED_LINK_PATTERN, (_match, url: string, label: string) => discordMaskedLink(url, label))
    .replace(SLACK_BARE_LINK_PATTERN, (_match, url: string) => `<${url}>`)
    // Model-native Discord links with `@handle` labels (same mention-rewriter issue).
    .replace(/\[@(?!\u200B)([^\]]+)\]\(/g, `[${AT_ZWSP}$1](`)
}

/**
 * Replaces `:shortcode:` emoji with their Discord unicode equivalent.
 * Shortcodes with no known mapping are left exactly as written — safer
 * than guessing, and it also means an accidental `:word:`-shaped false
 * positive (there are none in practice here) never mangles the text.
 */
function slackEmojiToDiscord(text: string): string {
  return text.replace(EMOJI_SHORTCODE_PATTERN, (original, name: string) => {
    const converted = emoji.toDiscord(emoji.fromSlack(name))
    return converted === name ? original : converted
  })
}

export function slackTextToDiscord(text: string): string {
  return slackEmojiToDiscord(slackLinksToMarkdown(text))
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

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars)
    const blankBreak = window.lastIndexOf('\n\n')
    const lineBreak = window.lastIndexOf('\n')
    const splitAt = blankBreak >= Math.floor(maxChars * 0.4)
      ? blankBreak
      : lineBreak >= Math.floor(maxChars * 0.4)
        ? lineBreak
        : maxChars

    chunks.push(remaining.slice(0, splitAt).trimEnd())
    remaining = remaining.slice(splitAt).replace(/^\n+/, '')
  }

  if (remaining.trim()) chunks.push(remaining.trim())
  return chunks
}
