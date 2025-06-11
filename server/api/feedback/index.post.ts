import type { H3Event } from 'h3'
import { z } from 'zod'

const feedbackSchema = z.object({
  rating: z.enum(['very-helpful', 'helpful', 'not-helpful', 'confusing']),
  feedback: z.string().optional(),
  path: z.string(),
  title: z.string(),
  stem: z.string()
})

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
  const { rating, feedback, path, title, stem } = await readValidatedBody(event, feedbackSchema.parse)

  const drizzle = useDrizzle()
  const country = event.context.cf?.country || 'unknown'

  const fingerprint = await getFingerprint(event, path)

  await drizzle.insert(tables.feedback).values({
    rating,
    feedback,
    path,
    title,
    stem,
    country,
    fingerprint,
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [tables.feedback.path, tables.feedback.fingerprint],
    set: {
      rating,
      feedback,
      title,
      stem,
      country,
      updatedAt: new Date()
    }
  })
})
