import type { Delivery } from 'eve/sessions'
import { postDiscordWorkflowParts } from '../../channels/discord.js'
import { slackTextToDiscord, splitDiscordMessages } from './format.js'

const FINAL_MESSAGE_MAX_ATTEMPTS = 3
const FINAL_MESSAGE_RETRY_DELAY_MS = 2_000

/**
 * In-process deliveries read the session stream once, so a drop before the
 * delivery settles rejects `result()`. Retry on a fresh read (cheap replay of
 * the durable log).
 */
async function finalMessageText(delivery: Delivery, signal: AbortSignal): Promise<string | null> {
  for (let attempt = 1; ; attempt++) {
    try {
      const result = await delivery.result({ signal })
      return result.reply || null
    } catch (error) {
      if (signal.aborted || attempt >= FINAL_MESSAGE_MAX_ATTEMPTS) throw error
      console.warn('[nuxi:digest-mirror] event stream ended before the delivery settled, retrying', {
        attempt,
        maxAttempts: FINAL_MESSAGE_MAX_ATTEMPTS
      })
      await new Promise(resolve => setTimeout(resolve, FINAL_MESSAGE_RETRY_DELAY_MS))
    }
  }
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
  delivery,
  channelId
}: {
  delivery: Delivery
  channelId: string
}): Promise<void> {
  try {
    console.log('[nuxi:digest-mirror] mirroring digest, reading Slack session event stream', {
      channelId,
      timeoutMs: EVENT_STREAM_TIMEOUT_MS
    })
    const controller = new AbortController()
    const text = await withTimeout(
      finalMessageText(delivery, controller.signal),
      EVENT_STREAM_TIMEOUT_MS,
      'reading Slack session event stream',
      () => controller.abort()
    )
    if (!text) {
      console.warn('[nuxi:digest-mirror] no final reply text on session stream, skipping mirror', {
        channelId
      })
      return
    }

    // Convert + split once, then post via the unwrapped adapter path so the
    // live Slack→Discord wrapper does not run a second pass.
    const parts = splitDiscordMessages(slackTextToDiscord(text))
    await postDiscordWorkflowParts(channelId, parts)

    console.log('[nuxi:digest-mirror] mirrored digest to Discord', {
      channelId,
      chars: text.length,
      parts: parts.length
    })
  } catch (error) {
    const timedOut = error instanceof Error && /timed out after \d+ms/.test(error.message)
    console.warn(
      timedOut
        ? '[nuxi:digest-mirror] mirror timed out waiting for Slack digest (may still post to Slack)'
        : '[nuxi:digest-mirror] failed to mirror digest to Discord',
      { channelId, timedOut, timeoutMs: EVENT_STREAM_TIMEOUT_MS },
      error
    )
  }
}
