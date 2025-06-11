import type { H3Event } from 'h3'
import { z } from 'zod'

const feedbackSchema = z.object({
  rating: z.enum(['very-helpful', 'helpful', 'not-helpful', 'confusing']),
  feedback: z.string().optional(),
  path: z.string(),
  title: z.string()
})

export default defineEventHandler(async (event: H3Event) => {
  const { rating, feedback, path, title } = await readValidatedBody(event, feedbackSchema.parse)

  const drizzle = useDrizzle()
  const fingerprint = await getRequestFingerprint(event, {
    userAgent: true
  }) || ''

  await drizzle.insert(tables.feedback).values({
    rating,
    feedback,
    path,
    title,
    fingerprint,
    createdAt: new Date()
  })
})
