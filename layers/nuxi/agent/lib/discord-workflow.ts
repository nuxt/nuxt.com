import type { Session } from 'eve/channels'
import { postDiscordWorkflowParts } from '../channels/discord.js'
import { slackTextToDiscord, splitDiscordMessages } from './discord-format.js'

/**
 * Reads the text Slack's default `message.completed` handler posts — skip
 * `finishReason: "tool-calls"` (pre-tool narration / typing label only).
 * Returns as soon as that event arrives; Slack thread sessions may never emit
 * `session.completed`, which would otherwise hang the mirror forever.
 */
async function finalMessageText(stream: Awaited<ReturnType<Session['getEventStream']>>): Promise<string | null> {
  for await (const event of stream) {
    if (event.type === 'message.completed') {
      if (event.data.finishReason === 'tool-calls') continue
      if (event.data.message) return event.data.message
    }
    if (event.type === 'session.completed' || event.type === 'session.failed') break
  }
  return null
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string, onTimeout?: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.()
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/** Budget against the schedule/ops 300s ceiling — weekly digest is heavier than firehose. */
const EVENT_STREAM_TIMEOUT_MS = 270_000

/**
 * Mirror a Slack digest session to Discord: reuse the model's text (no second
 * agent run), convert Slack mrkdwn → Discord, chunk to 2000 chars, post.
 *
 * Never throws — mirroring must not affect Slack delivery.
 */
export async function mirrorDigestToDiscord({
  session,
  channelId
}: {
  session: Session
  channelId: string
}): Promise<void> {
  try {
    console.log('[nuxi:discord-workflow] mirroring digest, reading Slack session event stream', {
      channelId,
      timeoutMs: EVENT_STREAM_TIMEOUT_MS
    })
    const stream = await session.getEventStream()
    const text = await withTimeout(
      finalMessageText(stream),
      EVENT_STREAM_TIMEOUT_MS,
      'reading Slack session event stream',
      () => { void stream.cancel() }
    )
    if (!text) {
      console.warn('[nuxi:discord-workflow] no final message.completed text on session stream, skipping mirror', {
        channelId
      })
      return
    }

    // Convert + split once, then post via the unwrapped adapter path so the
    // live Slack→Discord wrapper does not run a second pass.
    const parts = splitDiscordMessages(slackTextToDiscord(text))
    await postDiscordWorkflowParts(channelId, parts)

    console.log('[nuxi:discord-workflow] mirrored digest to Discord', {
      channelId,
      chars: text.length,
      parts: parts.length
    })
  } catch (error) {
    const timedOut = error instanceof Error && /timed out after \d+ms/.test(error.message)
    console.warn(
      timedOut
        ? '[nuxi:discord-workflow] mirror timed out waiting for Slack digest (may still post to Slack)'
        : '[nuxi:discord-workflow] failed to mirror digest to Discord',
      { channelId, timedOut, timeoutMs: EVENT_STREAM_TIMEOUT_MS },
      error
    )
  }
}
