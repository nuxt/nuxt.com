import { z } from 'zod'
import { checkBotId } from 'botid/server'
import { createError, defineHandler, deriveSecret, getRequestHeader, readValidatedBody, type RequestEvent } from 'nuxt/server'

const feedbackSchema = z.object({
  rating: z.enum(FEEDBACK_RATINGS),
  feedback: z.string().optional(),
  path: z.string(),
  title: z.string(),
  stem: z.string()
})

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

async function getFingerprint(event: RequestEvent): Promise<string> {
  const input = fingerprintInput(event)
  if (!input) return crypto.randomUUID()

  const secret = await fingerprintSecret()
  if (!secret) return crypto.randomUUID()

  return feedbackFingerprint(secret, input)
}

export default defineHandler(async (event) => {
  const verification = await checkBotId()
  if (verification.isBot) {
    throw createError({ status: 403, statusText: 'Forbidden' })
  }

  const data = await readValidatedBody(event, feedbackSchema.parse)

  const country = getRequestHeader(event, 'x-vercel-ip-country') || 'unknown'
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
