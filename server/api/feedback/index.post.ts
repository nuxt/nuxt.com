import { feedbackSchema, type FeedbackInput } from '~~/shared/types/feedback'
import type { H3Event } from 'h3'

async function getFingerprint(event: H3Event, path: string): Promise<string> {
  const ip = event.context.cf?.ip || 'unknown'
  const fingerprintString = `${ip}-${path}`

  const buffer = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(fingerprintString)
  )

  const hash = [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return hash
}

export default defineEventHandler(async (event: H3Event) => {
  const data: FeedbackInput = await readValidatedBody(event, feedbackSchema.parse)

  const drizzle = useDrizzle()
  const country = event.context.cf?.country || 'unknown'
  const fingerprint = await getFingerprint(event, data.path)

  await drizzle.insert(tables.feedback).values({
    ...data,
    country,
    fingerprint,
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [tables.feedback.path, tables.feedback.fingerprint],
    set: {
      ...data,
      country,
      updatedAt: new Date()
    }
  })
})
