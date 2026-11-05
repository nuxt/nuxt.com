import type { H3Event } from 'h3'
import { checkBotId } from 'botid/server'
import { deriveSecret } from 'nuxt/server'

let warnedMissingSecret = false

async function fingerprintSecret(): Promise<string | undefined> {
  try {
    return await deriveSecret('nuxt.com:feedback-fingerprint')
  } catch (error) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true
      console.warn('[feedback] Feedback is not deduplicated:', (error as Error).message)
    }
  }
}

async function getFingerprint(event: H3Event): Promise<string> {
  const input = fingerprintInput(event)
  if (!input) return crypto.randomUUID()

  const secret = await fingerprintSecret()
  if (!secret) return crypto.randomUUID()

  return feedbackFingerprint(secret, input)
}

export default defineEventHandler(async (event: H3Event) => {
  const verification = await checkBotId()
  if (verification.isBot) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const data: FeedbackInput = await readValidatedBody(event, feedbackSchema.parse)

  const country = getHeader(event, 'x-vercel-ip-country') || 'unknown'
  const fingerprint = await getFingerprint(event)

  await db.insert(schema.feedback).values({
    rating: data.rating,
    feedback: data.feedback || null,
    path: data.path,
    title: data.title,
    stem: data.stem,
    country,
    fingerprint,
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [schema.feedback.path, schema.feedback.fingerprint],
    set: {
      rating: data.rating,
      feedback: data.feedback || null,
      country,
      updatedAt: new Date()
    }
  })
})
