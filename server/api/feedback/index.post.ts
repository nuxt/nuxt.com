import type { H3Event } from 'h3'
import { z } from 'zod'

const feedbackSchema = z.object({
  rating: z.enum(['very-helpful', 'helpful', 'neutral', 'not-helpful', 'confusing']),
  feedback: z.string().optional(),
  path: z.string()
})

export default defineEventHandler(async (event: H3Event) => {
  const body = await readValidatedBody(event, feedbackSchema.parse)

  const { rating, feedback, path } = body

  const drizzle = useDrizzle()

  await drizzle.insert(tables.feedback).values({
    rating,
    feedback,
    path
  })
})
