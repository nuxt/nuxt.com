import type { H3Event } from 'h3'
import { db, schema } from 'hub:db'
import { feedbackSchema } from '../../../../types'
import type { FeedbackInput } from '../../../../types'

export async function generateHash(
  today: string,
  ip: string,
  domain: string,
  userAgent: string
): Promise<string> {
  const data = `${today}+${domain}+${ip}+${userAgent}`

  const buffer = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(data)
  )

  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getFingerprint(event: H3Event): Promise<string> {
  const ip = (event.context.cf as any)?.ip || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  const domain = getHeader(event, 'host') || 'localhost'
  const today = new Date().toISOString().split('T')[0]

  return generateHash(today, ip, domain, userAgent)
}

export default defineEventHandler(async (event: H3Event) => {
  const data: FeedbackInput = await readValidatedBody(event, feedbackSchema.parse)

  const country = (event.context.cf as any)?.country || 'unknown'
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
