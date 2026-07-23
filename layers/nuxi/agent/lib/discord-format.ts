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
  'nuxi': { slack: 'nuxi', gchat: '🟩' },
  'nuxter': { slack: 'nuxter', gchat: '💚' },
  'nuxt_cool': { slack: 'nuxt_cool', gchat: '😎' },
  'nuxt-intensifies': { slack: 'nuxt-intensifies', gchat: '⚡' },
  'nuxt_lurk': { slack: 'nuxt_lurk', gchat: '👀' }
})

const SLACK_LABELED_LINK_PATTERN = /<(https?:\/\/[^|>]+)\|([^>]+)>/g
const SLACK_BARE_LINK_PATTERN = /<(https?:\/\/[^>]+)>/g
const EMOJI_SHORTCODE_PATTERN = /:([\w-]+):/g

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
    .replace(SLACK_LABELED_LINK_PATTERN, (_match, url: string, label: string) => `[${label}](<${url}>)`)
    .replace(SLACK_BARE_LINK_PATTERN, (_match, url: string) => `<${url}>`)
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
