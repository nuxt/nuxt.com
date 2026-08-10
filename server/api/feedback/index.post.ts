import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const data: FeedbackInput = await readValidatedBody(event, feedbackSchema.parse)

  const country = event.context.cf?.country || 'unknown'
  const fingerprint = await getFeedbackFingerprint(event)

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
