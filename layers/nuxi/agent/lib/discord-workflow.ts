import type { Session } from 'eve/channels'
import { postDiscordWorkflowParts } from '../channels/discord.js'
import { slackTextToDiscord, splitDiscordMessages } from './discord-format.js'

/** `done: false` means the stream ended without a terminal event — an inconclusive drop, worth retrying. */
type StreamReadResult
  = | { done: true, message: string | null }
    | { done: false }

async function readFinalMessage(stream: Awaited<ReturnType<Session['getEventStream']>>): Promise<StreamReadResult> {
  for await (const event of stream) {
    if (event.type === 'message.completed') {
      if (event.data.finishReason === 'tool-calls') continue
      if (event.data.message) return { done: true, message: event.data.message }
    }
    if (event.type === 'session.completed' || event.type === 'session.failed') {
      return { done: true, message: null }
    }
  }
  return { done: false }
}

const FINAL_MESSAGE_MAX_ATTEMPTS = 3
const FINAL_MESSAGE_RETRY_DELAY_MS = 2_000

/** Retries on a fresh stream (cheap replay of the durable log) when a read ends inconclusively. */
async function finalMessageText(
  session: Session,
  onStream: (stream: Awaited<ReturnType<Session['getEventStream']>>) => void
): Promise<string | null> {
  for (let attempt = 1; attempt <= FINAL_MESSAGE_MAX_ATTEMPTS; attempt++) {
    const stream = await session.getEventStream({ startIndex: 0 })
    onStream(stream)
    const result = await readFinalMessage(stream)
    if (result.done) return result.message

    console.warn('[nuxi:discord-workflow] event stream ended without a terminal event, retrying', {
      attempt,
      maxAttempts: FINAL_MESSAGE_MAX_ATTEMPTS
    })
    if (attempt < FINAL_MESSAGE_MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, FINAL_MESSAGE_RETRY_DELAY_MS))
    }
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
    let currentStream: Awaited<ReturnType<Session['getEventStream']>> | null = null
    const text = await withTimeout(
      finalMessageText(session, (stream) => { currentStream = stream }),
      EVENT_STREAM_TIMEOUT_MS,
      'reading Slack session event stream',
      () => { void currentStream?.cancel() }
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
